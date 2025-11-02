import { command, query } from '$app/server';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { studyPlanStep } from '$lib/server/db/schema/tools.sql';
import { requireAuth } from './auth.remote';
import z from 'zod';

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
		}
	});

	if (!flashCards.length) return null;

	return flashCards;
});
