import { tool, type InferUITools, type ToolSet, type UIMessage } from 'ai';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from './db';
import { flashcard, studyPlanStep, studyStepTypes, project } from './db/schema';
import z from 'zod';
import { EXA_API_KEY } from '$env/static/private';
import { eq, asc } from 'drizzle-orm';
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

const webSearchTool = webSearch({
	type: 'auto', // intelligent hybrid search
	numResults: 3, // return up to 6 results
	contents: {
		text: { maxCharacters: 1000 }, // get up to 1000 chars per result
		livecrawl: 'preferred', // always get fresh content if possible
		summary: true // return an AI-generated summary for each result
	},
	apiKey: EXA_API_KEY
});

const studyPlanTool = tool({
	description:
		'Creates a study plan for the user at a given date using the context of given files.',
	inputSchema: zStudyStep,
	execute: async (args) => {
		const { params } = getRequestEvent();

		if (!params.project_id) error(404, 'No project ID');
		return await db
			.insert(studyPlanStep)
			.values({
				title: args.title,
				date: new Date(args.date),
				projectId: params.project_id,
				type: args.type,
				description: args.description
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
		const { params } = getRequestEvent();

		if (!params.project_id) error(404, 'No project ID');

		const { definition, term } = args;
		await db.insert(flashcard).values({
			term,
			definition,
			projectId: params.project_id
		});
	}
});

const getFlashcardsTool = tool({
	description: 'Retrieve all existing flashcards for the current project',
	inputSchema: z.object({}),

	execute: async () => {
		const { params } = getRequestEvent();

		if (!params.project_id) error(404, 'No project ID');

		return await db.select().from(flashcard).where(eq(flashcard.projectId, params.project_id));
	}
});

const getStudyPlanTool = tool({
	description: 'Retrieve the existing study plan for the current project',
	inputSchema: z.object({}),

	execute: async () => {
		const { params } = getRequestEvent();

		if (!params.project_id) error(404, 'No project ID');

		return await db
			.select()
			.from(studyPlanStep)
			.where(eq(studyPlanStep.projectId, params.project_id))
			.orderBy(asc(studyPlanStep.date));
	}
});

const getExamDate = tool({
	description: 'Retrieve the exam date of the current project',
	inputSchema: z.object({}),
	execute: async () => {
		const { params } = getRequestEvent();

		if (!params.project_id) error(404, 'No project ID');

		const qproject = await db.query.project.findFirst({ where: { id: params.project_id } });

		if (!qproject) error(404, 'Project not found');

		if (!qproject.examDate) return 'Project does not have an exam date yet';

		return qproject.examDate;
	}
});

const setExamDate = tool({
	description: 'Set the exam date of the current project',
	inputSchema: z.object({ date: z.iso.date() }),
	execute: async ({ date }) => {
		const { params } = getRequestEvent();

		if (!params.project_id) error(404, 'No project ID');

		const qproject = await db.query.project.findFirst({ where: { id: params.project_id } });

		if (!qproject) error(404, 'Project not found');

		await db
			.update(project)
			.set({ examDate: new Date(date) })
			.where(eq(project.id, qproject.id));
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
