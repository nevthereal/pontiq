import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { currentPracticeProgress, nextPracticeProgress, practiceQueue } from './flashcard-practice';
import type { Flashcard } from './server/db/schema';

const cards = ['a', 'b', 'c'].map((id) => ({ id }) as Flashcard);
const ids = (queue: Flashcard[]) => queue.map((card) => card.id);

describe('flashcard practice', () => {
	test('misses go behind unattempted cards and rotate behind other retries', () => {
		const first = nextPracticeProgress([], [], 'a', 'Blank');
		assert.deepEqual(
			ids(practiceQueue(cards, first.reviewedFlashcardIds, first.retryFlashcardIds)),
			['b', 'c', 'a']
		);
		const again = nextPracticeProgress([], ['a', 'b', 'c'], 'a', 'Hard');
		assert.deepEqual(
			ids(practiceQueue(cards, again.reviewedFlashcardIds, again.retryFlashcardIds)),
			['b', 'c', 'a']
		);
	});
	for (const rating of ['Good', 'Easy'] as const) {
		test(`${rating} completes a retry without duplicates`, () => {
			const progress = nextPracticeProgress(['b'], ['a', 'c'], 'a', rating);
			assert.deepEqual(progress, { reviewedFlashcardIds: ['b', 'a'], retryFlashcardIds: ['c'] });
			assert.deepEqual(
				ids(practiceQueue(cards, progress.reviewedFlashcardIds, progress.retryFlashcardIds)),
				['c']
			);
		});
	}
	test('a lone difficult card remains available and can be completed', () => {
		assert.deepEqual(ids(practiceQueue([cards[0]], [], ['a'])), ['a']);
		const done = nextPracticeProgress([], ['a'], 'a', 'Good');
		assert.deepEqual(
			practiceQueue([cards[0]], done.reviewedFlashcardIds, done.retryFlashcardIds),
			[]
		);
	});
	test('deleted cards are omitted from retries', () => {
		assert.deepEqual(ids(practiceQueue(cards, ['b'], ['deleted', 'a'])), ['c', 'a']);
	});
	test('progress resumes the same day and resets at the UTC day boundary', () => {
		const state = {
			sessionDay: '2026-11-17',
			reviewedFlashcardIds: ['a'],
			retryFlashcardIds: ['b']
		};
		assert.deepEqual(currentPracticeProgress(state, new Date('2026-11-17T23:59:59Z')), {
			reviewedFlashcardIds: ['a'],
			retryFlashcardIds: ['b']
		});
		assert.deepEqual(currentPracticeProgress(state, new Date('2026-11-18T00:00:00Z')), {
			reviewedFlashcardIds: [],
			retryFlashcardIds: []
		});
		assert.deepEqual(currentPracticeProgress(undefined), {
			reviewedFlashcardIds: [],
			retryFlashcardIds: []
		});
	});
});
