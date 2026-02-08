type ReviewRating = 1 | 2 | 3 | 4;

type FlashcardSchedule = {
	easeFactor: number;
	intervalDays: number;
	repetitions: number;
	lapses: number;
};

const MIN_EASE = 1.3;
const EASY_BONUS = 1.3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const ratingToQuality: Record<ReviewRating, number> = {
	1: 0, // Not at all (Again)
	2: 3, // Struggling (Hard)
	3: 4, // Got it! (Good)
	4: 5 // Very Fast (Easy)
};

const addDays = (date: Date, days: number) => {
	const result = new Date(date);
	result.setDate(result.getDate() + Math.max(0, Math.round(days)));
	return result;
};

const capIntervalForExam = (intervalDays: number, reviewedAt: Date, examDate?: Date | null) => {
	if (!examDate || Number.isNaN(examDate.getTime())) return intervalDays;

	const remainingDays = Math.floor((examDate.getTime() - reviewedAt.getTime()) / MS_PER_DAY);
	if (remainingDays <= 0) return Math.min(intervalDays, 1);

	let maxInterval = intervalDays;

	if (remainingDays <= 7) maxInterval = Math.max(1, Math.floor(remainingDays / 2));
	else if (remainingDays <= 30) maxInterval = Math.max(2, Math.floor(remainingDays / 3));
	else maxInterval = Math.max(3, Math.floor(remainingDays / 4));

	return Math.min(intervalDays, maxInterval);
};

export const applySrsReview = (
	schedule: FlashcardSchedule,
	rating: ReviewRating,
	reviewedAt: Date = new Date(),
	examDate?: Date | null
) => {
	const quality = ratingToQuality[rating];

	let { easeFactor, intervalDays, repetitions, lapses } = schedule;

	if (quality < 3) {
		repetitions = 0;
		intervalDays = 1;
		lapses += 1;
	} else {
		if (repetitions === 0) intervalDays = 1;
		else if (repetitions === 1) intervalDays = 6;
		else intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
		repetitions += 1;
	}

	if (rating === 4) intervalDays = Math.max(1, Math.round(intervalDays * EASY_BONUS) + 1);

	// SM-2 ease factor update
	easeFactor = Math.max(
		MIN_EASE,
		easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
	);

	intervalDays = capIntervalForExam(intervalDays, reviewedAt, examDate);

	return {
		easeFactor,
		intervalDays,
		repetitions,
		lapses,
		dueAt: addDays(reviewedAt, intervalDays),
		lastReviewedAt: reviewedAt,
		updatedAt: reviewedAt
	};
};

export type { ReviewRating, FlashcardSchedule };
