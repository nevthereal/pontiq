import { VERCEL_AI_KEY } from '$env/static/private';
import { createGateway } from '@ai-sdk/gateway';
import type { OpenAILanguageModelResponsesOptions } from '@ai-sdk/openai';
import {
	convertToModelMessages,
	generateText,
	smoothStream,
	stepCountIs,
	streamText,
	type UIMessageChunk
} from 'ai';
import { getWritable, getWorkflowMetadata } from 'workflow';
import type { ChatConfig } from '$lib/chat-config';
import {
	appendChatMessage,
	clearChatThreadActiveRun,
	updateChatThreadTitleIfDefault
} from '$lib/server/chat';
import { createChatTools, getChatSystemPrompt, type MyUIMessage } from '$lib/server/ai';

const gateway = createGateway({
	apiKey: VERCEL_AI_KEY
});

export type ChatWorkflowInput = {
	threadId: string;
	projectId: string;
	userId: string;
	userName: string;
	config: ChatConfig;
	toolsAllowed: boolean;
	messages: MyUIMessage[];
};

export type ChatTitleWorkflowInput = {
	threadId: string;
	firstMessage: MyUIMessage;
};

function sanitizeTitle(rawTitle: string) {
	return rawTitle
		.replace(/^["'\s]+|["'\s]+$/g, '')
		.replace(/\s+/g, ' ')
		.slice(0, 70)
		.trim();
}

function getPlainTextFromMessage(message: MyUIMessage) {
	return message.parts
		.filter((part) => part.type === 'text')
		.map((part) => part.text)
		.join('\n')
		.trim();
}

function getAttachedFileNamesFromMessage(message: MyUIMessage) {
	return message.parts
		.filter((part) => part.type === 'file')
		.map((part) => part.filename?.trim())
		.filter((filename): filename is string => Boolean(filename));
}

function isIgnorableStreamDisconnectError(error: unknown) {
	if (error == null) return true;

	if (error instanceof Error) {
		if (error.name === 'AbortError' || error.name === 'ResponseAborted') {
			return true;
		}

		const message = error.message.toLowerCase();
		return (
			message.includes('aborted') ||
			message.includes('closed') ||
			message.includes('invalid state') ||
			message.includes('controller is already closed')
		);
	}

	return false;
}

async function streamChatTurnStep(
	input: ChatWorkflowInput,
	writable: WritableStream<UIMessageChunk>
) {
	'use step';

	let responseMessage: MyUIMessage | undefined;
	let persistedAssistantMessageId: string | null = null;

	async function persistFinishedAssistantMessage(message: MyUIMessage) {
		const persistedMessage =
			message.id && message.id.length > 0 ? message : { ...message, id: crypto.randomUUID() };

		if (persistedAssistantMessageId === persistedMessage.id) {
			return;
		}

		await appendChatMessage({
			threadId: input.threadId,
			message: persistedMessage
		});

		persistedAssistantMessageId = persistedMessage.id;
	}

	const result = streamText({
		model: gateway('openai/gpt-5.4-mini'),
		messages: await convertToModelMessages(input.messages),
		system: getChatSystemPrompt({
			userName: input.userName,
			now: new Date(),
			config: input.config
		}),
		...(input.toolsAllowed
			? {
					tools: createChatTools({
						projectId: input.projectId,
						userId: input.userId
					})
				}
			: {}),
		stopWhen: stepCountIs(20),
		experimental_transform: smoothStream({
			chunking: 'word'
		}),
		providerOptions: {
			openai: {
				reasoningEffort: input.config.enhancedReasoning ? 'high' : 'none',
				reasoningSummary: 'detailed'
			} satisfies OpenAILanguageModelResponsesOptions
		}
	});

	const stream = result.toUIMessageStream<MyUIMessage>({
		originalMessages: input.messages,
		generateMessageId: () => crypto.randomUUID(),
		onFinish: async ({ responseMessage: finalMessage }) => {
			responseMessage = finalMessage;
			await persistFinishedAssistantMessage(finalMessage);
		}
	});

	const reader = stream.getReader();
	const writer = writable.getWriter();
	let streamDisconnected = false;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			if (streamDisconnected) continue;

			try {
				await writer.write(value);
			} catch (error) {
				if (!isIgnorableStreamDisconnectError(error)) {
					throw error;
				}

				streamDisconnected = true;
			}
		}
	} finally {
		reader.releaseLock();
		writer.releaseLock();
	}

	if (responseMessage) {
		await persistFinishedAssistantMessage(responseMessage);
	}

	if (!streamDisconnected) {
		try {
			await writable.close();
		} catch (error) {
			if (!isIgnorableStreamDisconnectError(error)) {
				throw error;
			}
		}
	}
}

async function clearRunStateStep(threadId: string) {
	'use step';

	const { workflowRunId } = getWorkflowMetadata();

	await clearChatThreadActiveRun({
		threadId,
		runId: workflowRunId
	});
}

async function generateThreadTitleStep(input: ChatTitleWorkflowInput) {
	'use step';

	const messageText = getPlainTextFromMessage(input.firstMessage);
	const attachedFileNames = getAttachedFileNamesFromMessage(input.firstMessage);

	if (!messageText && attachedFileNames.length === 0) return null;

	const attachmentsLine = attachedFileNames.length
		? `Attached files: ${attachedFileNames.join(', ')}`
		: 'Attached files: none';

	const result = await generateText({
		model: gateway('openai/gpt-5.4-nano'),
		system:
			'Write concise chat titles for a study app. Base the title on the user message and any attached file names. Return only the title, no quotes, no punctuation at the end unless needed.',
		prompt: `First message: ${messageText || '(no text)'}\n${attachmentsLine}\nTitle:`,
		providerOptions: {
			openai: {
				reasoningEffort: 'none'
			} satisfies OpenAILanguageModelResponsesOptions
		}
	});

	const title = sanitizeTitle(result.text);
	return title.length ? title : null;
}

async function persistThreadTitleStep(threadId: string, title: string) {
	'use step';

	await updateChatThreadTitleIfDefault({ threadId, title });
}

export async function runProjectChatTurn(input: ChatWorkflowInput) {
	'use workflow';

	const writable = getWritable<UIMessageChunk>();

	try {
		await streamChatTurnStep(input, writable);
	} finally {
		await clearRunStateStep(input.threadId);
	}
}

export async function generateProjectChatTitle(input: ChatTitleWorkflowInput) {
	'use workflow';

	const title = await generateThreadTitleStep(input);
	if (!title) return;

	await persistThreadTitleStep(input.threadId, title);
}
