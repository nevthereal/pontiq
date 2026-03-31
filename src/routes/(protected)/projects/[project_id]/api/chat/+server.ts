import { createUIMessageStreamResponse } from 'ai';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { autumn } from '$lib/server/autumn';
import {
	createChatThread,
	listThreadMessages,
	appendChatMessage,
	requireOwnedThread,
	setChatThreadRunState
} from '$lib/server/chat';
import { normalizeChatConfig } from '$lib/chat-config';
import type { MyUIMessage } from '$lib/server/ai';
import { generateProjectChatTitle, runProjectChatTurn } from '../../../../../../workflows/chat';
import { start } from 'workflow/api';

type ChatRequestBody = {
	messages: MyUIMessage[];
	config?: unknown;
	threadId?: string | null;
};

export const POST: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) {
		throw error(401, 'No user');
	}

	const { allowed } = await autumn.check({
		customerId: locals.user.id,
		featureId: 'messages'
	});

	if (!allowed) {
		throw error(402, 'No messages left');
	}

	const body = (await request.json()) as ChatRequestBody;
	const config = normalizeChatConfig(body.config as Record<string, unknown> | undefined);

	const messages = body.messages ?? [];
	const lastMessage = messages.at(-1);

	if (!lastMessage || lastMessage.role !== 'user') {
		throw error(400, 'A user message is required');
	}

	let threadId = body.threadId ?? null;
	let createdThread = false;

	if (threadId) {
		await requireOwnedThread({
			projectId: params.project_id,
			threadId,
			userId: locals.user.id
		});
	} else {
		const thread = await createChatThread({
			projectId: params.project_id,
			userId: locals.user.id
		});

		threadId = thread.id;
		createdThread = true;
	}

	await appendChatMessage({
		threadId,
		message: lastMessage
	});

	const persistedMessages = (await listThreadMessages({
		threadId
	})) as MyUIMessage[];

	const run = await start(runProjectChatTurn, [
		{
			threadId,
			projectId: params.project_id,
			userId: locals.user.id,
			userName: locals.user.name,
			config,
			messages: persistedMessages
		}
	]);

	await setChatThreadRunState({
		threadId,
		runId: run.runId,
		active: true
	});

	if (createdThread) {
		await start(generateProjectChatTitle, [
			{
				threadId,
				firstMessage: lastMessage
			}
		]);
	}

	try {
		await autumn.track({
			customerId: locals.user.id,
			featureId: 'messages',
			value: 1
		});
	} catch (trackingError) {
		console.error('Failed to track chat message usage', trackingError);
	}

	return createUIMessageStreamResponse({
		stream: run.readable,
		headers: {
			'x-workflow-run-id': run.runId,
			'x-chat-thread-id': threadId
		}
	});
};
