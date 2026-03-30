import { query } from '$app/server';
import z from 'zod';
import { requireAuth } from './auth.remote';
import {
	deleteChatThread,
	getChatThreadDetail,
	getRecentChatThreads,
	renameChatThread
} from '$lib/server/chat';
import { command } from '$app/server';

const zProjectInput = z.object({
	projectId: z.uuid()
});

const zThreadInput = z.object({
	projectId: z.uuid(),
	threadId: z.uuid()
});

const zRenameThreadInput = zThreadInput.extend({
	title: z.string().trim().min(1).max(120)
});

export const getProjectChatThreads = query(zProjectInput, async ({ projectId }) => {
	const user = await requireAuth();
	return await getRecentChatThreads({ projectId, userId: user.id, limit: 500 });
});

export const getRecentProjectChats = query(zProjectInput, async ({ projectId }) => {
	const user = await requireAuth();
	return await getRecentChatThreads({ projectId, userId: user.id, limit: 5 });
});

export const getProjectChatThread = query(zThreadInput, async ({ projectId, threadId }) => {
	const user = await requireAuth();
	return await getChatThreadDetail({ projectId, threadId, userId: user.id });
});

export const renameProjectChatThread = command(
	zRenameThreadInput,
	async ({ projectId, threadId, title }) => {
		const user = await requireAuth();
		const thread = await renameChatThread({
			projectId,
			threadId,
			title,
			userId: user.id
		});

		await Promise.all([
			getProjectChatThreads({ projectId }).refresh(),
			getRecentProjectChats({ projectId }).refresh(),
			getProjectChatThread({ projectId, threadId }).refresh()
		]);

		return thread;
	}
);

export const deleteProjectChatThread = command(zThreadInput, async ({ projectId, threadId }) => {
	const user = await requireAuth();
	await deleteChatThread({ projectId, threadId, userId: user.id });

	await Promise.all([
		getProjectChatThreads({ projectId }).refresh(),
		getRecentProjectChats({ projectId }).refresh()
	]);
});
