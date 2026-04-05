import { autumn } from './autumn';
import { db } from './db';

const PROJECTS_FEATURE_ID = 'projects';

const isAutumnErrorCode = (error: unknown, code: string) => {
	if (!error || typeof error !== 'object') return false;

	const maybeError = error as {
		body?: string;
	};

	if (typeof maybeError.body !== 'string') return false;

	return maybeError.body.includes(`"code":"${code}"`);
};

export const ensureProjectEntityExists = async ({
	customerId,
	projectId,
	projectName,
	offsetExistingUsage = false
}: {
	customerId: string;
	projectId: string;
	projectName?: string | null;
	offsetExistingUsage?: boolean;
}) => {
	try {
		await autumn.entities.get({
			customerId,
			entityId: projectId
		});

		return { created: false };
	} catch (error) {
		if (!isAutumnErrorCode(error, 'entity_not_found')) {
			throw error;
		}
	}

	let resolvedProjectName = projectName ?? null;

	if (!resolvedProjectName) {
		const existingProject = await db.query.project.findFirst({
			where: {
				id: projectId,
				creatorId: customerId
			},
			columns: {
				name: true
			}
		});

		resolvedProjectName = existingProject?.name ?? null;
	}

	try {
		await autumn.entities.create({
			customerId,
			entityId: projectId,
			featureId: PROJECTS_FEATURE_ID,
			name: resolvedProjectName ?? `Project ${projectId.slice(0, 8)}`
		});
	} catch (error) {
		if (!isAutumnErrorCode(error, 'entity_already_exists')) {
			throw error;
		}

		return { created: false };
	}

	if (offsetExistingUsage) {
		await autumn.track({
			customerId,
			featureId: PROJECTS_FEATURE_ID,
			value: -1
		});
	}

	return { created: true };
};

export const deleteProjectEntity = async ({
	customerId,
	projectId
}: {
	customerId: string;
	projectId: string;
}) => {
	return autumn.entities.delete({
		customerId,
		entityId: projectId
	});
};
