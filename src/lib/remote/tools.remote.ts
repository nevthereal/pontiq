import { command, form, query } from '$app/server';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { flashcard, flashcardReviewState, studyPlanStep } from '$lib/server/db/schema';
import { requireAuth } from './auth.remote';
import z from 'zod';
import { error } from '@sveltejs/kit';
import { ratings, studyStepTypes } from '$lib/things';
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

function normalizeDateInput(date: string) {
	const trimmedDate = date.trim();
	const normalizedDate = new Date(`${trimmedDate}T00:00:00`);

	if (Number.isNaN(normalizedDate.getTime())) {
		throw error(400, 'Invalid study step date');
	}

	return normalizedDate;
}

const flashcardFormSchema = z.object({
	projectId: z.uuid(),
	term: z.string().trim().min(1),
	definition: z.string().trim().min(1)
});

const studyStepFormSchema = z.object({
	projectId: z.uuid(),
	title: z.string().trim().min(1),
	description: z.string().trim().min(1),
	date: z.string().trim().min(1),
	type: z.enum(studyStepTypes)
});

export const getStudySteps = query(z.string(), async (projectId) => {
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

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

export const deleteAllStudySteps = command(z.string(), async (projectId) => {
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

	await db.delete(studyPlanStep).where(eq(studyPlanStep.projectId, projectId));

	getStudySteps(projectId).refresh();
});

export const createStudyStep = form(studyStepFormSchema, async ({ projectId, ...data }) => {
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

	const [createdStep] = await db
		.insert(studyPlanStep)
		.values({
			projectId,
			title: data.title,
			description: data.description,
			date: normalizeDateInput(data.date),
			type: data.type,
			source: 'manual'
		})
		.returning();

	getStudySteps(projectId).refresh();
	return createdStep;
});

export const updateStudyStep = form(
	studyStepFormSchema.extend({
		id: z.uuid()
	}),
	async ({ id, projectId, ...data }) => {
		const user = await requireAuth();

		const [updatedStep] = await db.transaction(async (tx) => {
			await requireOwnedProject(tx, projectId, user.id);

			const existingStep = await tx.query.studyPlanStep.findFirst({
				where: {
					id,
					projectId
				}
			});

			if (!existingStep) throw error(404, 'Study step not found');

			return await tx
				.update(studyPlanStep)
				.set({
					title: data.title,
					description: data.description,
					date: normalizeDateInput(data.date),
					type: data.type,
					manuallyEditedAt: new Date()
				})
				.where(and(eq(studyPlanStep.id, id), eq(studyPlanStep.projectId, projectId)))
				.returning();
		});

		getStudySteps(projectId).refresh();
		return updatedStep;
	}
);

export const deleteStudyStep = command(
	z.object({
		id: z.uuid(),
		projectId: z.uuid()
	}),
	async ({ id, projectId }) => {
		const user = await requireAuth();

		await db.transaction(async (tx) => {
			await requireOwnedProject(tx, projectId, user.id);

			const deletedSteps = await tx
				.delete(studyPlanStep)
				.where(and(eq(studyPlanStep.id, id), eq(studyPlanStep.projectId, projectId)))
				.returning({ id: studyPlanStep.id });

			if (!deletedSteps.length) throw error(404, 'Study step not found');
		});

		getStudySteps(projectId).refresh();
	}
);

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

	return await db
		.select()
		.from(flashcard)
		.where(eq(flashcard.projectId, projectId))
		.orderBy(ratingOrder, asc(flashcard.createdAt), asc(flashcard.id));
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

export const createFlashcard = form(flashcardFormSchema, async ({ projectId, ...data }) => {
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

	const [createdFlashcard] = await db
		.insert(flashcard)
		.values({
			projectId,
			term: data.term,
			definition: data.definition,
			source: 'manual'
		})
		.returning();

	getFlashCards(projectId).refresh();
	return createdFlashcard;
});

export const updateFlashcard = form(
	flashcardFormSchema.extend({
		id: z.uuid()
	}),
	async ({ id, projectId, ...data }) => {
		const user = await requireAuth();

		const [updatedFlashcard] = await db.transaction(async (tx) => {
			await requireOwnedProject(tx, projectId, user.id);

			const existingFlashcard = await tx.query.flashcard.findFirst({
				where: {
					id,
					projectId
				}
			});

			if (!existingFlashcard) throw error(404, 'Flashcard not found');

			const [nextFlashcard] = await tx
				.update(flashcard)
				.set({
					term: data.term,
					definition: data.definition,
					rating: 'Unrated',
					manuallyEditedAt: new Date()
				})
				.where(and(eq(flashcard.id, id), eq(flashcard.projectId, projectId)))
				.returning();

			await tx
				.update(flashcardReviewState)
				.set({
					reviewedFlashcardIds: sql`array_remove(${flashcardReviewState.reviewedFlashcardIds}, ${id})`
				})
				.where(eq(flashcardReviewState.projectId, projectId));

			return [nextFlashcard];
		});

		await Promise.all([
			getFlashCards(projectId).refresh(),
			getFlashcardReviewState(projectId).refresh()
		]);

		return updatedFlashcard;
	}
);

export const deleteFlashcard = command(
	z.object({
		id: z.uuid(),
		projectId: z.uuid()
	}),
	async ({ id, projectId }) => {
		const user = await requireAuth();

		await db.transaction(async (tx) => {
			await requireOwnedProject(tx, projectId, user.id);

			const deletedFlashcards = await tx
				.delete(flashcard)
				.where(and(eq(flashcard.id, id), eq(flashcard.projectId, projectId)))
				.returning({ id: flashcard.id });

			if (!deletedFlashcards.length) throw error(404, 'Flashcard not found');

			await tx
				.update(flashcardReviewState)
				.set({
					reviewedFlashcardIds: sql`array_remove(${flashcardReviewState.reviewedFlashcardIds}, ${id})`
				})
				.where(eq(flashcardReviewState.projectId, projectId));
		});

		await Promise.all([
			getFlashCards(projectId).refresh(),
			getFlashcardReviewState(projectId).refresh()
		]);
	}
);

export const deleteAllFlashcards = command(z.string(), async (projectId) => {
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

	await db.transaction(async (tx) => {
		await tx.delete(flashcard).where(eq(flashcard.projectId, projectId));
		await tx.delete(flashcardReviewState).where(eq(flashcardReviewState.projectId, projectId));
	});

	await Promise.all([
		getFlashCards(projectId).refresh(),
		getFlashcardReviewState(projectId).refresh()
	]);
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

			await tx
				.insert(flashcardReviewState)
				.values({
					projectId,
					userId: user.id,
					reviewedFlashcardIds: [flashcardId]
				})
				.onConflictDoNothing({
					target: [flashcardReviewState.userId, flashcardReviewState.projectId]
				});

			await tx
				.update(flashcardReviewState)
				.set({
					reviewedFlashcardIds: sql`array_append(${flashcardReviewState.reviewedFlashcardIds}, ${flashcardId})`
				})
				.where(
					and(
						eq(flashcardReviewState.projectId, projectId),
						eq(flashcardReviewState.userId, user.id),
						sql`not (${flashcardId} = any(${flashcardReviewState.reviewedFlashcardIds}))`
					)
				);
		});
	}
);

export const resetFlashcardReviewState = command(z.string(), async (projectId) => {
	const user = await requireAuth();
	await requireOwnedProject(db, projectId, user.id);

	await db
		.delete(flashcardReviewState)
		.where(
			and(eq(flashcardReviewState.projectId, projectId), eq(flashcardReviewState.userId, user.id))
		);
});
