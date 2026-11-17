import type { Flashcard } from '#lib/server/db/schema/index.ts';
import type { ratings } from '#lib/things.ts';

export type PracticeRating = Exclude<(typeof ratings)[number], 'Unrated'>;

export function practiceDay(now = new Date()) {
	return now.toISOString().slice(0, 10);
}

export function currentPracticeProgress(
	state:
		| {
				sessionDay: string;
				reviewedFlashcardIds: string[];
				retryFlashcardIds: string[];
		  }
		| undefined,
	now = new Date()
) {
	const current = state?.sessionDay === practiceDay(now);
	return {
		reviewedFlashcardIds: current ? state.reviewedFlashcardIds : [],
		retryFlashcardIds: current ? state.retryFlashcardIds : []
	};
}

export function nextPracticeProgress(
	completed: string[],
	retry: string[],
	cardId: string,
	rating: PracticeRating
) {
	const reviewedFlashcardIds = completed.filter((id) => id !== cardId);
	const retryFlashcardIds = retry.filter((id) => id !== cardId);
	if (rating === 'Blank' || rating === 'Hard') retryFlashcardIds.push(cardId);
	else reviewedFlashcardIds.push(cardId);
	return { reviewedFlashcardIds, retryFlashcardIds };
}

export function practiceQueue(cards: Flashcard[], completed: string[], retry: string[]) {
	const completedIds = new Set(completed);
	const retryIds = new Set(retry);
	const byId = new Map(cards.map((card) => [card.id, card]));
	return [
		...cards.filter((card) => !completedIds.has(card.id) && !retryIds.has(card.id)),
		...retry.flatMap((id) => {
			const card = byId.get(id);
			return card && !completedIds.has(id) ? [card] : [];
		})
	];
}
