import { command, query } from '$app/server';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { flashcard, studyPlanStep, project } from '$lib/server/db/schema';
import { requireAuth } from './auth.remote';
import z from 'zod';
import { error } from '@sveltejs/kit';
import { applySrsReview } from '$lib/srs';

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
		where: (t, { and, eq, lte }) =>
			and(eq(t.projectId, projectId), lte(t.dueAt, new Date()), eq(t.suspended, false)),
		orderBy: (t, { asc }) => [asc(t.dueAt), asc(t.createdAt)]
	});

	if (!flashCards.length) return null;

	return flashCards;
});

export const reviewFlashcard = command(
	z.object({
		projectId: z.string(),
		flashcardId: z.string(),
		rating: z.number().int().min(1).max(4)
	}),
	async ({ projectId, flashcardId, rating }) => {
		const user = await requireAuth();

		const projectRow = await db.query.project.findFirst({
			where: {
				id: projectId,
				creatorId: user.id
			}
		});

		if (!projectRow) throw error(404, 'Project not found');

		const rows = await db
			.select()
			.from(flashcard)
			.where(and(eq(flashcard.id, flashcardId), eq(flashcard.projectId, projectId)))
			.limit(1);

		if (!rows.length) throw error(404, 'Flashcard not found');

		const card = rows[0];
		const now = new Date();
		const next = applySrsReview(
			{
				easeFactor: card.easeFactor,
				intervalDays: card.intervalDays,
				repetitions: card.repetitions,
				lapses: card.lapses
			},
			rating,
			now,
			projectRow.examDate
		);

		await db
			.update(flashcard)
			.set(next)
			.where(and(eq(flashcard.id, flashcardId), eq(flashcard.projectId, projectId)));

		await getFlashCards(projectId).refresh();
	}
);
