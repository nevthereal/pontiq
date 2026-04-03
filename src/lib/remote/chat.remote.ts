import { form, query } from '$app/server';
import z from 'zod';
import { requireAuth } from './auth.remote';
import {
	deleteChatThread,
	getChatThreadDetail,
	getRecentChatThreads,
	renameChatThread
} from '$lib/server/chat';

const zProjectInput = z.object({
	projectId: z.uuid()
});

const zThreadInput = z.object({
	projectId: z.uuid(),
	threadId: z.uuid()
});

const zThreadFormInput = z.object({
	projectId: z.uuid(),
	id: z.uuid()
});

const zRenameThreadFormInput = zThreadFormInput.extend({
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

export const renameProjectChatThread = form(
	zRenameThreadFormInput,
	async ({ projectId, id, title }) => {
		const user = await requireAuth();
		const thread = await renameChatThread({
			projectId,
			threadId: id,
			title,
			userId: user.id
		});

		await Promise.all([
			getProjectChatThreads({ projectId }).refresh(),
			getRecentProjectChats({ projectId }).refresh(),
			getProjectChatThread({ projectId, threadId: id }).refresh()
		]);

		return thread;
	}
);

export const deleteProjectChatThread = form(zThreadFormInput, async ({ projectId, id }) => {
	const user = await requireAuth();
	await deleteChatThread({ projectId, threadId: id, userId: user.id });

	await Promise.all([
		getProjectChatThreads({ projectId }).refresh(),
		getRecentProjectChats({ projectId }).refresh()
	]);
});
