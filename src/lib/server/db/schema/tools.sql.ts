import { index, pgEnum, pgTable, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { project } from './projects.sql';
import { user } from './auth.sql';
import { ratings } from '../../../things';

export const studyStepTypes = [
	'milestone',
	'lesson',
	'assignment',
	'project',
	'exam',
	'review',
	'break'
] as const;

export const typeEnum = pgEnum('study_plan_types', studyStepTypes);

const projectId = uuid()
	.references(() => project.id, { onDelete: 'cascade' })
	.notNull();

export const studyPlanStep = pgTable('study_plan_step', {
	id: uuid().primaryKey().defaultRandom(),
	date: timestamp().notNull(),
	projectId,
	title: text().notNull(),
	description: text().notNull(),
	type: typeEnum().notNull()
});

export const ratingEnum = pgEnum('recall_levels', ratings);

export const flashcard = pgTable(
	'flashcard',
	{
		id: uuid().primaryKey().defaultRandom(),
		term: text().notNull(),
		definition: text().notNull(),
		projectId,
		createdAt: timestamp().defaultNow().notNull(),
		updatedAt: timestamp().defaultNow().notNull(),
		rating: ratingEnum().notNull().default('Unrated')
	},
	(t) => [index('flashcard_project_idx').on(t.projectId)]
);

export const flashcardReviewState = pgTable(
	'flashcard_review_state',
	{
		id: uuid().primaryKey().defaultRandom(),
		projectId,
		userId: text()
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		reviewedFlashcardIds: text().array().notNull().default(sql`'{}'::text[]`),
		updatedAt: timestamp()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(t) => [
		index('flashcard_review_state_project_idx').on(t.projectId),
		index('flashcard_review_state_user_idx').on(t.userId),
		unique('flashcard_review_state_user_project_unique').on(t.userId, t.projectId)
	]
);

export type Flashcard = typeof flashcard.$inferSelect;
