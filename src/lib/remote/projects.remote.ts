import { command, form, query } from '$app/server';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';
import { requireAuth } from './auth.remote';
import { project, subject } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const getSubjectsWithProjects = query(async () => {
	const user = await requireAuth();

	const projects = await db.query.subject.findMany({
		where: {
			creatorId: user.id
		},
		with: {
			projects: true
		}
	});

	return projects;
});

export const getSubjects = query(async () => {
	const user = await requireAuth();

	const subjects = await db.query.subject.findMany({
		where: {
			creatorId: user.id,
			active: true
		}
	});

	return subjects;
});

export const getProject = query(z.string(), async (id) => {
	const user = await requireAuth();

	const project = await db.query.project.findFirst({
		where: {
			id,
			creatorId: user.id
		},
		with: {
			files: true
		}
	});

	if (!project) error(404, 'Project not found');

	return project;
});

export const createProject = form(
	z.object({ name: z.string().min(5), subjectId: z.uuid() }),
	async ({ name, subjectId }) => {
		const user = await requireAuth();

		const [{ id }] = await db
			.insert(project)
			.values({
				name,
				subjectId,
				creatorId: user.id
			})
			.returning();
		return redirect(302, `/project/${id}`);
	}
);

export const createSubject = form(z.object({ title: z.string() }), async ({ title }) => {
	const user = await requireAuth();

	await db.insert(subject).values({
		title,
		creatorId: user.id
	});
});

export const deleteSubject = command(z.string(), async (id) => {
	const user = await requireAuth();
	await db.transaction(async (tx) => {
		const qSubject = await tx.query.subject.findFirst({
			where: {
				id,
				creatorId: user.id
			}
		});

		if (!qSubject) return error(401, 'Not your subject');

		await tx.delete(subject).where(eq(subject.id, qSubject.id));
	});
});

export const deleteProject = command(z.string(), async (id) => {
	const user = await requireAuth();
	await db.transaction(async (tx) => {
		const qProject = await tx.query.project.findFirst({
			where: {
				id,
				creatorId: user.id
			}
		});

		if (!qProject) return error(401, 'Not your project');

		await tx.delete(project).where(eq(project.id, qProject.id));
	});
});

export const editProject = form(
	z.object({ id: z.uuid(), name: z.string() }),
	async ({ id, name }) => {
		const user = await requireAuth();
		await db.transaction(async (tx) => {
			const qProject = await tx.query.project.findFirst({
				where: {
					id,
					creatorId: user.id
				}
			});

			if (!qProject) return error(401, 'Not your project');

			await tx.update(project).set({ name }).where(eq(project.id, qProject.id));
		});
	}
);

export const editSubject = form(
	z.object({ id: z.uuid(), title: z.string().min(3) }),
	async ({ id, title }) => {
		const user = await requireAuth();
		await db.transaction(async (tx) => {
			const qSubject = await tx.query.subject.findFirst({
				where: {
					id,
					creatorId: user.id
				}
			});

			if (!qSubject) return error(401, 'Not your subject');

			await tx.update(subject).set({ title }).where(eq(subject.id, qSubject.id));
		});
	}
);
