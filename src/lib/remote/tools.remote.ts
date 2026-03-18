import { command, query } from '$app/server';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { flashcard, studyPlanStep } from '$lib/server/db/schema';
import { requireAuth } from './auth.remote';
import z from 'zod';
import { error } from '@sveltejs/kit';
import { ratings } from '$lib/utils';
import { autumn } from '$lib/server/autumn';

export const getStudySteps = query(z.string(), async (projectId) => {
	const steps = await db.query.studyPlanStep.findMany({
		where: {
			projectId
		},
		orderBy: {
			date: 'asc'
		}
	});

	if (!steps.length) return null;

	return steps;
});

export const deleteSteps = command(z.string(), async (projectId) => {
	await requireAuth();

	await db.delete(studyPlanStep).where(eq(studyPlanStep.projectId, projectId));

	getStudySteps(projectId).refresh();
});

export const checkFlashcard = query(async () => {
	const user = await requireAuth();
	const { allowed } = await autumn.check({
		customerId: user.id,
		featureId: 'flashcards'
	});

	return allowed;
});

export const getFlashCards = query(z.string(), async (projectId) => {
	await requireAuth();

	const flashCards = await db.query.flashcard.findMany({
		where: {
			projectId
		},
		orderBy: {
			rating: 'asc'
		}
	});

	return flashCards;
});

export const applyRating = command(
	z.object({ rating: z.enum(ratings), flashcardId: z.string(), projectId: z.string() }),
	async ({ flashcardId, rating, projectId }) => {
		const user = await requireAuth();
		const projectRow = await db.query.project.findFirst({
			where: { id: projectId, creatorId: user.id }
		});

		if (!projectRow) throw error(404, 'Project not found');

		await db
			.update(flashcard)
			.set({ rating })
			.where(and(eq(flashcard.id, flashcardId), eq(flashcard.projectId, projectId)));
	}
);
