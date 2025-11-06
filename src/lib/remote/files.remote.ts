import { command, query } from '$app/server';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { requireAuth } from './auth.remote';
import { db } from '$lib/server/db';
import { file } from '$lib/server/db/schema';
import z from 'zod';
import { utapi } from '$lib/server/uploadthing';
import { DrizzleError } from 'drizzle-orm/errors';
import { UploadThingError } from 'uploadthing/server';

export const getFiles = query(z.string(), async (projectId) => {
	const user = await requireAuth();

	return await db
		.select()
		.from(file)
		.where(and(eq(file.projectId, projectId), eq(file.ownerId, user.id)));
});

export const getAllFiles = query(async () => {
	const user = await requireAuth();

	return await db.query.file.findMany({
		where: {
			ownerId: user.id
		},
		with: {
			project: true
		}
	});
});

export const deleteFile = command(z.uuid(), async (fileId) => {
	const user = await requireAuth();

	try {
		// 1) Lookup with authz
		const rows = await db
			.select()
			.from(file)
			.where(and(eq(file.id, fileId), eq(file.ownerId, user.id)))
			.limit(1);
		if (!rows.length) throw error(404, 'File not found');
		const f = rows[0];

		// 2) Delete from storage first
		await utapi.deleteFiles([f.utKey]);

		// 3) Delete DB row
		await db.delete(file).where(eq(file.id, fileId));

		// 4) Refresh cache
		await getFiles(f.projectId).refresh();
	} catch (err) {
		if (err instanceof DrizzleError) throw error(500, err.message);
		if (err instanceof UploadThingError) throw error(500, err.message);
		throw error(500, JSON.stringify(err));
	}
});
