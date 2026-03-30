import { tool, type InferUITools, type ToolSet, type UIMessage } from 'ai';
import { error } from '@sveltejs/kit';
import { db } from './db';
import { flashcard, project, studyPlanStep } from './db/schema';
import { studyStepTypes } from '$lib/things';
import z from 'zod';
import { EXA_API_KEY } from '$env/static/private';
import { and, asc, eq } from 'drizzle-orm';
import { webSearch } from '@exalabs/ai-sdk';
import type { ChatConfig } from '$lib/chat-config';
import { ensureProjectBelongsToUser } from './chat';

export type ChatToolContext = {
	projectId: string;
	userId: string;
};

const zStudyStep = z.object({
	title: z
		.string()
		.describe(
			'Short description/Name of the step of the studyplan. Please do not include stuff like "lesson:" or "assignment" or "revision" in here. The title should be short and about the thing to study about.'
		),
	date: z.iso.datetime().describe('When the step should be commenced in ISO 8601 datetime format'),
	description: z.string().describe('More detailed information about the step'),
	type: z.enum(studyStepTypes)
});

async function requireOwnedProjectId(context: ChatToolContext) {
	return await ensureProjectBelongsToUser(context.projectId, context.userId);
}

const rawWebSearchTool = webSearch({
	type: 'auto',
	numResults: 3,
	contents: {
		text: { maxCharacters: 1000 },
		livecrawl: 'preferred',
		summary: true
	},
	apiKey: EXA_API_KEY
});

export function createChatTools(context: ChatToolContext) {
	const webSearchTool = tool({
		description: rawWebSearchTool.description,
		inputSchema: z.object({
			query: z
				.string()
				.min(1)
				.max(500)
				.describe("The web search query - be specific and clear about what you're looking for")
		}),
		execute: async ({ query }, options) => {
			await requireOwnedProjectId(context);
			if (!rawWebSearchTool.execute) {
				throw new Error('Web search tool is not executable');
			}
			return await rawWebSearchTool.execute({ query }, options);
		}
	});

	const studyPlanTool = tool({
		description:
			'Creates a study plan for the user at a given date using the context of given files.',
		inputSchema: zStudyStep,
		execute: async (args) => {
			const projectId = await requireOwnedProjectId(context);
			const date = new Date(args.date);
			const [existingStep] = await db
				.select()
				.from(studyPlanStep)
				.where(
					and(
						eq(studyPlanStep.projectId, projectId),
						eq(studyPlanStep.title, args.title),
						eq(studyPlanStep.date, date),
						eq(studyPlanStep.type, args.type)
					)
				)
				.limit(1);

			if (existingStep) return [existingStep];

			return await db
				.insert(studyPlanStep)
				.values({
					title: args.title,
					date,
					projectId,
					type: args.type,
					description: args.description,
					source: 'ai'
				})
				.returning();
		}
	});

	const flashCardTool = tool({
		description: 'Create flashcards from given files',
		inputSchema: z.object({
			term: z.string(),
			definition: z.string()
		}),
		execute: async (args) => {
			const projectId = await requireOwnedProjectId(context);

			const [existingFlashcard] = await db
				.select()
				.from(flashcard)
				.where(
					and(
						eq(flashcard.projectId, projectId),
						eq(flashcard.term, args.term),
						eq(flashcard.definition, args.definition)
					)
				)
				.limit(1);

			if (existingFlashcard) return existingFlashcard;

			const [createdFlashcard] = await db
				.insert(flashcard)
				.values({
					term: args.term,
					definition: args.definition,
					projectId,
					source: 'ai'
				})
				.returning();

			return createdFlashcard;
		}
	});

	const getFlashcardsTool = tool({
		description: 'Retrieve all existing flashcards for the current project',
		inputSchema: z.object({}),
		execute: async () => {
			const projectId = await requireOwnedProjectId(context);
			return await db
				.select()
				.from(flashcard)
				.where(eq(flashcard.projectId, projectId))
				.orderBy(asc(flashcard.createdAt), asc(flashcard.id));
		}
	});

	const getStudyPlanTool = tool({
		description: 'Retrieve the existing study plan for the current project',
		inputSchema: z.object({}),
		execute: async () => {
			const projectId = await requireOwnedProjectId(context);
			return await db
				.select()
				.from(studyPlanStep)
				.where(eq(studyPlanStep.projectId, projectId))
				.orderBy(asc(studyPlanStep.date));
		}
	});

	const getExamDate = tool({
		description: 'Retrieve the exam date of the current project',
		inputSchema: z.object({}),
		execute: async () => {
			const projectId = await requireOwnedProjectId(context);

			const qproject = await db.query.project.findFirst({ where: { id: projectId } });
			if (!qproject) throw error(404, 'Project not found');
			if (!qproject.examDate) return 'Project does not have an exam date yet';

			return qproject.examDate;
		}
	});

	const setExamDate = tool({
		description: 'Set the exam date of the current project',
		inputSchema: z.object({ date: z.iso.date() }),
		execute: async ({ date }) => {
			const projectId = await requireOwnedProjectId(context);

			await db
				.update(project)
				.set({ examDate: new Date(date) })
				.where(eq(project.id, projectId));
		}
	});

	return {
		study_plan: studyPlanTool,
		flashcards: flashCardTool,
		get_flashcards: getFlashcardsTool,
		get_study_plan: getStudyPlanTool,
		web_search: webSearchTool,
		setExamDate,
		getExamDate
	} satisfies ToolSet;
}

export function getChatSystemPrompt(input: { userName: string; now: Date; config: ChatConfig }) {
	const DEFAULT_SYS_PROMPT =
		`You are a friendly study chatbot assistant in a study app called Pontiq` +
		`You should be answering the questions from the provided files, if given, else answer from your knowledge or search the web.` +
		`Please answer in the language you were prompted or the language of given files.` +
		`The user's name is ${input.userName} and right now is ${input.now}.` +
		`Don't explain too heavily what you did in tool calls, since the user can see this in the UI`;

	const STUDY_MODE_PROMPT =
		DEFAULT_SYS_PROMPT +
		`You are acting as an approachable-yet-dynamic teacher who helps the user learn through guided discovery, not by giving answers.

  === STUDY MODE SYSTEM PROMPT ===

  PURPOSE
  Help the user learn - not by doing the work for them, but by:
  - Explaining concepts clearly at their level,
  - Asking guiding questions,
  - Building on what they already know,
  - Checking understanding,
  - Encouraging active learning.

  1. Get to know the user
  - Before starting, find out the user's goals or grade level.
  - If unknown, default to explanations for a 10th-grade student.

  2. Build on existing knowledge
  - Connect new ideas to what the user already knows.
  - Use analogies or familiar examples.

  3. Guide, don't give answers
  - Never solve homework directly.
  - Use Socratic questioning: one small step or question at a time.
  - Wait for the user's reply before continuing.
  - Help the user reason their way to understanding.

  4. Check and reinforce
  - After a hard point, confirm understanding by asking the user to explain or apply it.
  - Use summaries, mnemonics, or short reviews to reinforce.

  5. Vary the rhythm
  - Mix explanation, questioning, mini-quizzes, and roleplay.
  - Keep it conversational and interactive.
  - Focus on one idea at a time; avoid information overload.

  6. What's allowed
  - Teaching new concepts
  - Helping with homework through guidance
  - Running quizzes (one question at a time)
  - Encouraging reasoning and self-correction

  What's not allowed
  - Giving direct answers to homework/test problems
  - Solving multi-step problems all at once
  - Asking multiple questions at once
  - Writing essay-length responses
  - Overly casual tone or excessive emojis

  Tone & Approach
  - Warm, patient, and plain-spoken.
  - Encourage curiosity.
  - Be concise and responsive.
  - Always move logically to the next teaching step.

  END OF STUDY MODE SYSTEM PROMPT
  `;

	return (
		(input.config.studyModeEnabled ? STUDY_MODE_PROMPT : DEFAULT_SYS_PROMPT) +
		(input.config.webSearch ? ' Use web search' : '')
	);
}

export type ChatTools = InferUITools<ReturnType<typeof createChatTools>>;

export type MyUIMessage = UIMessage<never, never, ChatTools>;
