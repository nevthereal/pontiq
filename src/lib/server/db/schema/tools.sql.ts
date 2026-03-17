import { index, pgEnum, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { project } from './projects.sql';
import { ratings } from '../../../utils';

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

export type Flashcard = typeof flashcard.$inferSelect;
