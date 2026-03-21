import { getRequestEvent, query } from '$app/server';
import { autumn } from '$lib/server/autumn';
import { redirect } from '@sveltejs/kit';

export const getUser = query(async () => {
	const { locals } = getRequestEvent();
	const { user } = locals;

	if (user) {
		const customer = await autumn.customers.getOrCreate({
			customerId: user.id,
			name: user.name,
			email: user.email,
			expand: ['subscriptions.plan', 'balances.feature']
		});

		return { ...user, customer };
	}

	return null;
});

export const requireAuth = query(() => {
	const { locals } = getRequestEvent();

	if (!locals.user) return redirect(307, '/auth');

	return locals.user;
});
