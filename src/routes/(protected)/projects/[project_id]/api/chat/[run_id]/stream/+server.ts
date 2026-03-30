import { createUIMessageStreamResponse } from 'ai';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findThreadByLatestRun } from '$lib/server/chat';
import { getRun } from 'workflow/api';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) {
		throw error(401, 'No user');
	}

	await findThreadByLatestRun({
		projectId: params.project_id,
		userId: locals.user.id,
		runId: params.run_id
	});

	const startIndexParam = url.searchParams.get('startIndex');
	const startIndex = startIndexParam ? Number.parseInt(startIndexParam, 10) : undefined;

	const run = getRun(params.run_id);
	const readable = run.getReadable({ startIndex });
	const tailIndex = await readable.getTailIndex();

	return createUIMessageStreamResponse({
		stream: readable,
		headers: {
			'x-workflow-stream-tail-index': String(tailIndex)
		}
	});
};
