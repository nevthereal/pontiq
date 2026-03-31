import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { defineRelations } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const relations = defineRelations(schema, (r) => ({
	project: {
		subject: r.one.subject({
			from: r.project.subjectId,
			to: r.subject.id
		}),
		files: r.many.file({
			from: r.project.id,
			to: r.file.projectId
		})
	},
	subject: {
		projects: r.many.project({
			from: r.subject.id,
			to: r.project.subjectId
		})
	},
	file: {
		project: r.one.project({
			from: r.file.projectId,
			to: r.project.id
		})
	}
}));

export const db = drizzle(env.DATABASE_URL, { relations });
