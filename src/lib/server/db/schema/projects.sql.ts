import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth.sql';

export const project = pgTable(
	'project',
	{
		id: uuid().defaultRandom().primaryKey(),
		name: text().notNull(),
		subjectId: uuid()
			.references(() => subject.id, { onDelete: 'cascade' })
			.notNull(),
		creatorId: text()
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		pinned: boolean().notNull().default(false),
		examDate: timestamp(),
		createdAt: timestamp().defaultNow()
	},
	(t) => [index('prj_sub_idx').on(t.subjectId), index('prj_creator_idx').on(t.creatorId)]
);

export const subject = pgTable(
	'subject',
	{
		id: uuid().defaultRandom().primaryKey(),
		title: text().notNull(),
		creatorId: text()
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		active: boolean().default(true).notNull(),
		pinned: boolean().notNull().default(false),
		createdAt: timestamp().defaultNow()
	},
	(t) => [index('sub_creator_idx').on(t.creatorId)]
);

export const file = pgTable(
	'file',
	{
		id: uuid().defaultRandom().primaryKey(),
		name: text().notNull(),
		ownerId: text()
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		utURL: text().notNull(),
		utKey: text().notNull(),
		type: text().notNull(),
		projectId: uuid()
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		uploaded: timestamp().defaultNow().notNull()
	},
	(t) => [
		index('url_idx').on(t.utURL),
		index('key_idx').on(t.utKey),
		index('project_idx').on(t.projectId),
		index('file_owner_idx').on(t.ownerId)
	]
);

export type File = typeof file.$inferSelect;
