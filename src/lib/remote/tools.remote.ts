import { command, query } from '$app/server';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { flashcard, studyPlanStep, project } from '$lib/server/db/schema';
import { requireAuth } from './auth.remote';
import z from 'zod';
import { error } from '@sveltejs/kit';
import { ratings } from '$lib/utils';

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

export const getFlashCards = query(z.string(), async (projectId) => {
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
	z.object({ rating: z.enum(ratings), flashcardId: z.string() }),
	async ({ flashcardId, rating }) => {
		await db.update(flashcard).set({ rating }).where(eq(flashcard.id, flashcardId));
	}
);
