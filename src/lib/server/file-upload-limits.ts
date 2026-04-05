import { autumn } from './autumn';
import { ensureProjectEntityExists } from './project-entities';

const FILE_UPLOADS_FEATURE_ID = 'file_uploads';

export const getProjectFileUploadLimit = async ({
	customerId,
	projectId,
	requiredBalance = 1
}: {
	customerId: string;
	projectId: string;
	requiredBalance?: number;
}) => {
	await ensureProjectEntityExists({
		customerId,
		projectId,
		offsetExistingUsage: true
	});

	return autumn.check({
		customerId,
		featureId: FILE_UPLOADS_FEATURE_ID,
		entityId: projectId,
		requiredBalance
	});
};

export const consumeProjectFileUpload = async ({
	customerId,
	projectId
}: {
	customerId: string;
	projectId: string;
}) => {
	await ensureProjectEntityExists({
		customerId,
		projectId,
		offsetExistingUsage: true
	});

	return autumn.check({
		customerId,
		featureId: FILE_UPLOADS_FEATURE_ID,
		entityId: projectId,
		requiredBalance: 1,
		sendEvent: true
	});
};

export const refundProjectFileUpload = async ({
	customerId,
	projectId,
	amount = 1
}: {
	customerId: string;
	projectId: string;
	amount?: number;
}) => {
	await ensureProjectEntityExists({
		customerId,
		projectId,
		offsetExistingUsage: true
	});

	return autumn.track({
		customerId,
		featureId: FILE_UPLOADS_FEATURE_ID,
		entityId: projectId,
		value: -amount
	});
};

export const getFileUploadLimitErrorMessage = (
	balance:
		| {
				remaining: number;
				unlimited: boolean;
		  }
		| null
		| undefined,
	requestedCount = 1
) => {
	if (balance?.unlimited) {
		return 'This project can upload unlimited files on the current plan';
	}

	const remaining = balance?.remaining ?? 0;

	if (remaining <= 0) {
		return 'This project has reached its file upload limit for the current plan';
	}

	if (requestedCount > 1) {
		return `This upload needs ${requestedCount} slots, but only ${remaining} ${remaining === 1 ? 'slot is' : 'slots are'} available for this project`;
	}

	return `Only ${remaining} ${remaining === 1 ? 'file upload slot is' : 'file upload slots are'} available for this project`;
};
