import { UploadThingError, UTApi } from 'uploadthing/server';
import { file } from './db/schema';
import { createUploadthing } from 'uploadthing/server';
import type { FileRouter } from 'uploadthing/server';
import { db } from './db';
import { UPLOADTHING_TOKEN } from '$env/static/private';
import {
	consumeProjectFileUpload,
	getFileUploadLimitErrorMessage,
	getProjectFileUploadLimit,
	refundProjectFileUpload
} from './file-upload-limits';
import { eq } from 'drizzle-orm';
import { auth } from './auth';

const f = createUploadthing();

const getProjectIdFromUploadRequest = (request: Request) => {
	const pathname = new URL(request.url).pathname;
	const match = pathname.match(/\/app\/project\/([^/]+)\/api\/upload$/);

	return match?.[1] ? decodeURIComponent(match[1]) : null;
};

const deleteUploadedFile = async (fileKey: string) => {
	try {
		await utapi.deleteFiles([fileKey]);
	} catch (storageError) {
		console.error('Failed to delete uploaded file after limit enforcement', storageError);
	}
};

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
		.middleware(async ({ files, req }) => {
			// This code runs on your server before upload
			try {
				const session = await auth.api.getSession({
					headers: req.headers
				});
				const user = session?.user;

				if (!user) throw new UploadThingError('Unauthorized');

				const project_id = getProjectIdFromUploadRequest(req);
				// If you throw, the user will not be able to upload
				if (!project_id) throw new UploadThingError('Project not found');

				const ownedProject = await db.query.project.findFirst({
					where: {
						id: project_id,
						creatorId: user.id
					},
					columns: {
						id: true
					}
				});

				if (!ownedProject) throw new UploadThingError('Project not found');

				const limit = await getProjectFileUploadLimit({
					customerId: user.id,
					projectId: project_id,
					requiredBalance: files.length
				});

				if (!limit.allowed) {
					throw new UploadThingError(getFileUploadLimitErrorMessage(limit.balance, files.length));
				}

				// Whatever is returned here is accessible in onUploadComplete as `metadata`
				return { userId: user.id, projectId: project_id };
			} catch (middlewareError) {
				console.error('UploadThing middleware failed', middlewareError);
				throw middlewareError;
			}
		})
		.onUploadError(async (input) => {
			console.error('UploadThing upload failed', {
				fileKey: input.fileKey,
				error: input.error
			});
		})
		.onUploadComplete(async ({ file: uploadedFile, metadata }) => {
			const existingFile = await db
				.select({ id: file.id })
				.from(file)
				.where(eq(file.utKey, uploadedFile.key))
				.limit(1);

			if (existingFile.length > 0) {
				return;
			}

			let usageTracked = false;

			try {
				const limit = await consumeProjectFileUpload({
					customerId: metadata.userId,
					projectId: metadata.projectId
				});

				if (!limit.allowed) {
					await deleteUploadedFile(uploadedFile.key);
					throw new UploadThingError(getFileUploadLimitErrorMessage(limit.balance));
				}

				usageTracked = true;

				await db.insert(file).values({
					projectId: metadata.projectId,
					type: uploadedFile.type,
					utURL: uploadedFile.ufsUrl,
					name: uploadedFile.name,
					ownerId: metadata.userId,
					utKey: uploadedFile.key
				});
			} catch (uploadError) {
				await deleteUploadedFile(uploadedFile.key);

				if (usageTracked) {
					try {
						await refundProjectFileUpload({
							customerId: metadata.userId,
							projectId: metadata.projectId
						});
					} catch (refundError) {
						console.error('Failed to refund file upload usage after upload error', refundError);
					}
				}

				throw uploadError;
			}
		})
} satisfies FileRouter;

export type MyRouter = typeof myRouter;

export const utapi = new UTApi({
	token: UPLOADTHING_TOKEN
});
