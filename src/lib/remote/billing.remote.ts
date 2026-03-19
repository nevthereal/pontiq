import { command, getRequestEvent } from '$app/server';
import { autumn } from '$lib/server/autumn';
import { requireAuth } from './auth.remote';

export const subscribe = command(async () => {
	const user = await requireAuth();

	await autumn.billing.attach({
		customerId: user.id,
		planId: 'pontiq_pro'
	});
});

export const customerPortal = command(async () => {
	const user = await requireAuth();

	const reqEvent = getRequestEvent();

	const { url } = await autumn.billing.openCustomerPortal({
		customerId: user.id,
		returnUrl: reqEvent.url.href
	});

	return url;
});
