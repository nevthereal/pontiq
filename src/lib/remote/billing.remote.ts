import { command, getRequestEvent, query } from '$app/server';
import { autumn } from '$lib/server/autumn';
import { requireAuth } from './auth.remote';

export const subscribeToPro = command(async () => {
	const user = await requireAuth();

	const { url } = getRequestEvent();

	const { paymentUrl } = await autumn.billing.attach({
		customerId: user.id,
		planId: 'pontiq_pro',
		successUrl: url.href
	});

	return paymentUrl;
});

export const getCustomer = query(async () => {
	const user = await requireAuth();
	const cus = await autumn.customers.getOrCreate({
		customerId: user.id,
		name: user.name,
		email: user.email,
		expand: ['subscriptions.plan']
	});

	const isPro = cus.subscriptions.some((s) => s.status === 'active' && s.planId === 'pontiq_pro');

	return { ...cus, isPro };
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

export const getToolsLimit = query(async () => {
	const user = await requireAuth();

	const limit = await autumn.check({
		customerId: user.id,
		featureId: 'tool_use'
	});

	return limit;
});
