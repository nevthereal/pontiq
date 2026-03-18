import { command } from '$app/server';
import { autumn } from '$lib/server/autumn';
import { requireAuth } from './auth.remote';

export const subscribe = command(async () => {
	const user = await requireAuth();

	autumn.billing.attach({
		customerId: user.id,
		planId: 'pontiq_pro'
	});
});

export const create;
