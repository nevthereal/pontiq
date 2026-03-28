import { tool, type InferUITools, type ToolSet, type UIMessage } from 'ai';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from './db';
import { flashcard, studyPlanStep, studyStepTypes, project } from './db/schema';
import z from 'zod';
import { EXA_API_KEY } from '$env/static/private';
import { and, asc, eq } from 'drizzle-orm';
import { webSearch } from '@exalabs/ai-sdk';

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

async function requireOwnedProjectId() {
	const { params, locals } = getRequestEvent();

	if (!locals.user) error(401, 'Not signed in');
	if (!params.project_id) error(404, 'No project ID');

	const ownedProject = await db.query.project.findFirst({
		columns: { id: true },
		where: { id: params.project_id, creatorId: locals.user.id }
	});

	if (!ownedProject) error(404, 'Project not found');

	return ownedProject.id;
}

const rawWebSearchTool = webSearch({
	type: 'auto', // intelligent hybrid search
	numResults: 3, // return up to 6 results
	contents: {
		text: { maxCharacters: 1000 }, // get up to 1000 chars per result
		livecrawl: 'preferred', // always get fresh content if possible
		summary: true // return an AI-generated summary for each result
	},
	apiKey: EXA_API_KEY
});

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
		await requireOwnedProjectId();
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
		const projectId = await requireOwnedProjectId();
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
		const projectId = await requireOwnedProjectId();

		const { definition, term } = args;
		const [existingFlashcard] = await db
			.select()
			.from(flashcard)
			.where(
				and(
					eq(flashcard.projectId, projectId),
					eq(flashcard.term, term),
					eq(flashcard.definition, definition)
				)
			)
			.limit(1);

		if (existingFlashcard) return existingFlashcard;

		const [createdFlashcard] = await db
			.insert(flashcard)
			.values({
				term,
				definition,
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
		const projectId = await requireOwnedProjectId();
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
		const projectId = await requireOwnedProjectId();

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
		const projectId = await requireOwnedProjectId();

		const qproject = await db.query.project.findFirst({ where: { id: projectId } });
		if (!qproject) error(404, 'Project not found');
		if (!qproject.examDate) return 'Project does not have an exam date yet';

		return qproject.examDate;
	}
});

const setExamDate = tool({
	description: 'Set the exam date of the current project',
	inputSchema: z.object({ date: z.iso.date() }),
	execute: async ({ date }) => {
		const projectId = await requireOwnedProjectId();

		await db
			.update(project)
			.set({ examDate: new Date(date) })
			.where(eq(project.id, projectId));
	}
});

export const tools = {
	study_plan: studyPlanTool,
	flashcards: flashCardTool,
	get_flashcards: getFlashcardsTool,
	get_study_plan: getStudyPlanTool,
	web_search: webSearchTool,
	setExamDate,
	getExamDate
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

export type MyUIMessage = UIMessage<never, never, ChatTools>;
