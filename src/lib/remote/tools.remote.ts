import { command, query } from '$app/server';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { flashcard, flashcardReviewState, studyPlanStep } from '$lib/server/db/schema';
import { requireAuth } from './auth.remote';
import z from 'zod';
import { error } from '@sveltejs/kit';
import { ratings } from '$lib/things';
import { autumn } from '$lib/server/autumn';

async function requireOwnedProject(
	database: Pick<typeof db, 'query'>,
	projectId: string,
	userId: string
) {
	const projectRow = await database.query.project.findFirst({
		where: { id: projectId, creatorId: userId }
	});

	if (!projectRow) throw error(404, 'Project not found');

	return projectRow;
}

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
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

	const ratingOrder = sql`case
		when ${flashcard.rating} = 'Unrated' then 0
		when ${flashcard.rating} = 'Blank' then 1
		when ${flashcard.rating} = 'Hard' then 2
		when ${flashcard.rating} = 'Good' then 3
		when ${flashcard.rating} = 'Easy' then 4
		else 5
	end`;

	const flashCards = await db
		.select()
		.from(flashcard)
		.where(eq(flashcard.projectId, projectId))
		.orderBy(ratingOrder, asc(flashcard.createdAt), asc(flashcard.id));

	return flashCards;
});

export const getFlashcardReviewState = query(z.string(), async (projectId) => {
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

	const reviewState = await db.query.flashcardReviewState.findFirst({
		where: {
			projectId,
			userId: user.id
		}
	});

	return {
		reviewedFlashcardIds: reviewState?.reviewedFlashcardIds ?? []
	};
});

export const applyRating = command(
	z.object({ rating: z.enum(ratings), flashcardId: z.string(), projectId: z.string() }),
	async ({ flashcardId, rating, projectId }) => {
		const user = await requireAuth();
		await requireOwnedProject(db, projectId, user.id);

		await db
			.update(flashcard)
			.set({ rating })
			.where(and(eq(flashcard.id, flashcardId), eq(flashcard.projectId, projectId)));
	}
);

export const markFlashcardReviewed = command(
	z.object({ flashcardId: z.string(), projectId: z.string() }),
	async ({ flashcardId, projectId }) => {
		const user = await requireAuth();

		await db.transaction(async (tx) => {
			await requireOwnedProject(tx, projectId, user.id);

			const flashcardRow = await tx.query.flashcard.findFirst({
				where: {
					id: flashcardId,
					projectId
				}
			});

			if (!flashcardRow) throw error(404, 'Flashcard not found');

			const existingState = await tx.query.flashcardReviewState.findFirst({
				where: {
					projectId,
					userId: user.id
				}
			});

			if (!existingState) {
				await tx.insert(flashcardReviewState).values({
					projectId,
					userId: user.id,
					reviewedFlashcardIds: [flashcardId]
				});
				return;
			}

			if (existingState.reviewedFlashcardIds.includes(flashcardId)) return;

			await tx
				.update(flashcardReviewState)
				.set({
					reviewedFlashcardIds: [...existingState.reviewedFlashcardIds, flashcardId]
				})
				.where(eq(flashcardReviewState.id, existingState.id));
		});
	}
);

export const resetFlashcardReviewState = command(z.string(), async (projectId) => {
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

	await db
		.delete(flashcardReviewState)
		.where(
			and(
				eq(flashcardReviewState.projectId, projectId),
				eq(flashcardReviewState.userId, user.id)
			)
		);
});
