import { command, getRequestEvent, query } from '$app/server';
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

export const getChatLimit = query(async () => {
	const user = await requireAuth();

	const limit = await autumn.check({
		customerId: user.id,
		featureId: 'messages'
	});

	return limit;
});

export const getProjectLimit = query(async () => {
	const user = await requireAuth();

	const limit = await autumn.check({
		customerId: user.id,
		featureId: 'projects'
	});

	return limit;
});
