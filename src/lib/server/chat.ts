import { and, desc, eq, sql } from 'drizzle-orm';
import type { UIMessage } from 'ai';
import { error } from '@sveltejs/kit';
import { db } from './db';
import { chatMessage, chatThread, project } from './db/schema';

export type StoredChatMessage = UIMessage;

export type ChatThreadSummary = {
	id: string;
	title: string;
	activeRunId: string | null;
	updatedAt: Date;
	createdAt: Date;
};

export type ChatThreadDetail = ChatThreadSummary & {
	messages: StoredChatMessage[];
};

export async function assertOwnedProject(projectId: string, userId: string) {
	const ownedProject = await db.query.project.findFirst({
		columns: { id: true, name: true },
		where: {
			id: projectId,
			creatorId: userId
		}
	});

	if (!ownedProject) {
		throw error(404, 'Project not found');
	}

	return ownedProject;
}

export async function createChatThread(input: {
	projectId: string;
	userId: string;
	title?: string;
}) {
	await assertOwnedProject(input.projectId, input.userId);

	const [thread] = await db
		.insert(chatThread)
		.values({
			projectId: input.projectId,
			creatorId: input.userId,
			title: input.title?.trim() || 'New chat'
		})
		.returning();

	return thread;
}

export async function getRecentChatThreads(input: {
	projectId: string;
	userId: string;
	limit?: number;
}) {
	await assertOwnedProject(input.projectId, input.userId);

	return await db
		.select({
			id: chatThread.id,
			title: chatThread.title,
			activeRunId: chatThread.activeRunId,
			updatedAt: chatThread.updatedAt,
			createdAt: chatThread.createdAt
		})
		.from(chatThread)
		.where(and(eq(chatThread.projectId, input.projectId), eq(chatThread.creatorId, input.userId)))
		.orderBy(desc(chatThread.updatedAt), desc(chatThread.createdAt))
		.limit(input.limit ?? 5);
}

export async function renameChatThread(input: {
	projectId: string;
	userId: string;
	threadId: string;
	title: string;
}) {
	const title = input.title.trim();
	if (!title.length) {
		throw error(400, 'Chat title is required');
	}

	await requireOwnedThread({
		projectId: input.projectId,
		userId: input.userId,
		threadId: input.threadId
	});

	const [thread] = await db
		.update(chatThread)
		.set({
			title,
			updatedAt: new Date()
		})
		.where(eq(chatThread.id, input.threadId))
		.returning({
			id: chatThread.id,
			title: chatThread.title,
			activeRunId: chatThread.activeRunId,
			updatedAt: chatThread.updatedAt,
			createdAt: chatThread.createdAt
		});

	if (!thread) {
		throw error(404, 'Chat thread not found');
	}

	return thread satisfies ChatThreadSummary;
}

export async function deleteChatThread(input: {
	projectId: string;
	userId: string;
	threadId: string;
}) {
	await requireOwnedThread({
		projectId: input.projectId,
		userId: input.userId,
		threadId: input.threadId
	});

	const [thread] = await db
		.delete(chatThread)
		.where(eq(chatThread.id, input.threadId))
		.returning({ id: chatThread.id });

	if (!thread) {
		throw error(404, 'Chat thread not found');
	}
}

export async function getChatThreadDetail(input: {
	projectId: string;
	userId: string;
	threadId: string;
}) {
	await assertOwnedProject(input.projectId, input.userId);

	const thread = await db.query.chatThread.findFirst({
		where: {
			id: input.threadId,
			projectId: input.projectId,
			creatorId: input.userId
		}
	});

	if (!thread) {
		throw error(404, 'Chat thread not found');
	}

	const messages = await listThreadMessages({ threadId: thread.id });

	return {
		id: thread.id,
		title: thread.title,
		activeRunId: thread.activeRunId,
		updatedAt: thread.updatedAt,
		createdAt: thread.createdAt,
		messages
	} satisfies ChatThreadDetail;
}

export async function listThreadMessages(input: { threadId: string }) {
	const messages = await db.query.chatMessage.findMany({
		where: {
			threadId: input.threadId
		},
		orderBy: {
			sequence: 'asc'
		}
	});

	return messages.map((message) => message.message as StoredChatMessage);
}

export async function appendChatMessage(input: { threadId: string; message: StoredChatMessage }) {
	return await db.transaction(async (tx) => {
		// Serialize appends per thread so sequence assignment stays unique under concurrency.
		await tx.execute(
			sql`select 1 from ${chatThread} where ${chatThread.id} = ${input.threadId} for update`
		);

		const existingMessage = await tx.query.chatMessage.findFirst({
			where: {
				threadId: input.threadId,
				uiMessageId: input.message.id
			}
		});

		const sequenceResult = await tx
			.select({
				value: sql<number>`coalesce(max(${chatMessage.sequence}), 0)`
			})
			.from(chatMessage)
			.where(eq(chatMessage.threadId, input.threadId));

		const nextSequence = existingMessage?.sequence ?? (sequenceResult[0]?.value ?? 0) + 1;

		const [inserted] = await tx
			.insert(chatMessage)
			.values({
				threadId: input.threadId,
				sequence: nextSequence,
				uiMessageId: input.message.id,
				role: input.message.role,
				message: input.message
			})
			.onConflictDoUpdate({
				target: [chatMessage.threadId, chatMessage.uiMessageId],
				set: {
					role: input.message.role,
					message: input.message
				}
			})
			.returning();

		await tx
			.update(chatThread)
			.set({
				updatedAt: new Date()
			})
			.where(eq(chatThread.id, input.threadId));

		return inserted ?? null;
	});
}

export async function touchChatThread(threadId: string) {
	await db
		.update(chatThread)
		.set({
			updatedAt: new Date()
		})
		.where(eq(chatThread.id, threadId));
}

export async function setChatThreadRunState(input: {
	threadId: string;
	runId: string;
	active: boolean;
}) {
	await db
		.update(chatThread)
		.set({
			latestRunId: input.runId,
			activeRunId: input.active ? input.runId : null,
			updatedAt: new Date()
		})
		.where(eq(chatThread.id, input.threadId));
}

export async function clearChatThreadActiveRun(input: { threadId: string; runId: string }) {
	await db
		.update(chatThread)
		.set({
			activeRunId: null,
			updatedAt: new Date()
		})
		.where(and(eq(chatThread.id, input.threadId), eq(chatThread.activeRunId, input.runId)));
}

export async function findThreadByLatestRun(input: {
	projectId: string;
	userId: string;
	runId: string;
}) {
	await assertOwnedProject(input.projectId, input.userId);

	const thread = await db.query.chatThread.findFirst({
		where: {
			projectId: input.projectId,
			creatorId: input.userId,
			latestRunId: input.runId
		}
	});

	if (!thread) {
		throw error(404, 'Chat run not found');
	}

	return thread;
}

export async function updateChatThreadTitleIfDefault(input: { threadId: string; title: string }) {
	const title = input.title.trim();
	if (!title) return;

	await db
		.update(chatThread)
		.set({
			title,
			updatedAt: new Date()
		})
		.where(and(eq(chatThread.id, input.threadId), eq(chatThread.title, 'New chat')));
}

export async function countThreadMessages(threadId: string) {
	const [result] = await db
		.select({
			value: sql<number>`count(*)::int`
		})
		.from(chatMessage)
		.where(eq(chatMessage.threadId, threadId));

	return result?.value ?? 0;
}

export async function requireOwnedThread(input: {
	projectId: string;
	userId: string;
	threadId: string;
}) {
	await assertOwnedProject(input.projectId, input.userId);

	const thread = await db.query.chatThread.findFirst({
		where: {
			id: input.threadId,
			projectId: input.projectId,
			creatorId: input.userId
		}
	});

	if (!thread) {
		throw error(404, 'Chat thread not found');
	}

	return thread;
}

export async function getProjectName(projectId: string) {
	const ownedProject = await db.query.project.findFirst({
		columns: {
			name: true
		},
		where: {
			id: projectId
		}
	});

	return ownedProject?.name ?? 'Project';
}

export async function ensureProjectBelongsToUser(projectId: string, userId: string) {
	const ownedProject = await db.query.project.findFirst({
		columns: { id: true },
		where: {
			id: projectId,
			creatorId: userId
		}
	});

	if (!ownedProject) {
		throw error(404, 'Project not found');
	}

	return ownedProject.id;
}
