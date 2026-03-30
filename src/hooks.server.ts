import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

const WORKFLOW_ABORT_GUARD = Symbol.for('ai-study.workflow-abort-guard');

function isIgnorableUnhandledRejection(reason: unknown) {
	if (reason == null) return true;

	if (reason instanceof Error) {
		if (reason.name === 'AbortError' || reason.name === 'ResponseAborted') {
			return true;
		}

		const message = reason.message.toLowerCase();
		return (
			message.includes('aborted') ||
			message.includes('request aborted') ||
			message.includes('response aborted') ||
			message.includes('stream aborted')
		);
	}

	return false;
}

if (!(globalThis as Record<PropertyKey, unknown>)[WORKFLOW_ABORT_GUARD]) {
	(globalThis as Record<PropertyKey, unknown>)[WORKFLOW_ABORT_GUARD] = true;

	process.on('unhandledRejection', (reason) => {
		if (isIgnorableUnhandledRejection(reason)) {
			console.warn('Ignored abort-like unhandled rejection during workflow streaming.');
			return;
		}

		throw reason instanceof Error ? reason : new Error(String(reason));
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.user = session.user;
		event.locals.session = session.session;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
