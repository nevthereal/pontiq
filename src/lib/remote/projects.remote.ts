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
		}
	});

	if (!project) error(404, 'Project not found');

	return project;
});

export const getProjectDetails = query(z.string(), async (id) => {
	const user = await requireAuth();

	const projectWithRelations = await db.query.project.findFirst({
		where: {
			id,
			creatorId: user.id
		},
		with: {
			subject: true,
			files: true
		}
	});

	if (!projectWithRelations) error(404, 'Project not found');

	// Get all study steps for count
	const allStudySteps = await db.query.studyPlanStep.findMany({
		where: { projectId: id },
		orderBy: { date: 'asc' }
	});

	// Get next 3 upcoming study steps (from today onwards)
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const upcomingSteps = allStudySteps.filter((step) => step.date >= now).slice(0, 3);

	// Get flashcards count
	const flashcards = await db.query.flashcard.findMany({
		where: { projectId: id }
	});

	return {
		...projectWithRelations,
		fileCount: projectWithRelations.files.length,
		studyStepCount: allStudySteps.length,
		flashcardCount: flashcards.length,
		upcomingSteps
	};
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
		return redirect(302, `/projects/${id}`);
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
