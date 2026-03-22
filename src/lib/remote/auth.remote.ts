import { getRequestEvent, query } from '$app/server';
import { autumn } from '$lib/server/autumn';
import { redirect } from '@sveltejs/kit';

export const getUser = query(async () => {
	const { locals } = getRequestEvent();
	const { user } = locals;

	return user;
});

export const requireAuth = query(() => {
	const { locals } = getRequestEvent();

	if (!locals.user) return redirect(307, '/auth');

	return locals.user;
});
