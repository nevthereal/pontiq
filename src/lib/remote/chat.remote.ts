import { query } from '$app/server';
import z from 'zod';
import { requireAuth } from './auth.remote';
import { getChatThreadDetail, getRecentChatThreads } from '$lib/server/chat';

const zProjectInput = z.object({
	projectId: z.uuid()
});

const zThreadInput = z.object({
	projectId: z.uuid(),
	threadId: z.uuid()
});

export const getRecentProjectChats = query(zProjectInput, async ({ projectId }) => {
	const user = await requireAuth();
	return await getRecentChatThreads({ projectId, userId: user.id, limit: 5 });
});

export const getProjectChatThread = query(zThreadInput, async ({ projectId, threadId }) => {
	const user = await requireAuth();
	return await getChatThreadDetail({ projectId, threadId, userId: user.id });
});
