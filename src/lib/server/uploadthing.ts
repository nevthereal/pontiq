import { UploadThingError, UTApi } from 'uploadthing/server';
import { requireAuth } from '$lib/remote/auth.remote';
import { file } from './db/schema';
import { error } from '@sveltejs/kit';
import { createUploadthing } from 'uploadthing/server';
import type { FileRouter } from 'uploadthing/server';
import { db } from './db';
import { getRequestEvent } from '$app/server';
import { UPLOADTHING_TOKEN } from '$env/static/private';
import { autumn } from './autumn';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const myRouter = {
	// Define as many FileRoutes as you like, each with a unique routeSlug
	uploader: f({
		image: {
			/**
			 * For full list of options and defaults, see the File Route API reference
			 * @see https://docs.uploadthing.com/file-routes#route-config
			 */
			maxFileSize: '16MB',
			maxFileCount: 10
		},
		pdf: {
			maxFileSize: '128MB',
			maxFileCount: 10
		},
		text: { maxFileCount: 10 }
	})
		// Set permissions and file types for this FileRoute
		.middleware(async ({ files }) => {
			// This code runs on your server before upload
			const user = await requireAuth();
			const event = getRequestEvent();

			const { project_id } = event.params;

			// If you throw, the user will not be able to upload
			if (!project_id) throw new UploadThingError('Project not found');

			if (!allowed)
				throw new UploadThingError(`You cannot upload more files ${balance?.remaining}`);

			// Whatever is returned here is accessible in onUploadComplete as `metadata`
			return { userId: user.id, prjId: project_id };
		})
		.onUploadComplete(async ({ file: uploadedFile, metadata }) => {
			await db.insert(file).values({
				projectId: metadata.prjId,
				type: uploadedFile.type,
				utURL: uploadedFile.ufsUrl,
				name: uploadedFile.name,
				ownerId: metadata.userId,
				utKey: uploadedFile.key
			});
		})
} satisfies FileRouter;

export type MyRouter = typeof myRouter;

export const utapi = new UTApi({
	token: UPLOADTHING_TOKEN
});
