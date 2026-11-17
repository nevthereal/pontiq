<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { practiceDay, practiceQueue, type PracticeRating } from '#lib/flashcard-practice.ts';
	import { resolve } from '$app/paths';
	import Flashcard from '#lib/components/flashcards/Flashcard.svelte';
	import ToolHeading from '#lib/components/typography/ToolHeading.svelte';
	import Button, { buttonVariants } from '#lib/components/ui/button/button.svelte';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';

	import * as Popover from '#lib/components/ui/popover/index.js';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';

	import {
		reviewFlashcard,
		getFlashcardReviewState,
		getFlashCards,
		resetFlashcardReviewState
	} from '#lib/remote/tools.remote.ts';
	import { cn } from '#lib/utils.ts';
	import { ratings } from '#lib/things.ts';
	import {
		Copy,
		CopyX,
		Frown,
		Laugh,
		ListFilter,
		Meh,
		RefreshCcw,
		Settings2,
		Smile
	} from '@lucide/svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { watch } from 'runed';

	let { params } = $props();

	const flashcards = $derived(await getFlashCards(params.project_id));
	const reviewState = $derived(await getFlashcardReviewState(params.project_id));
	let flipped = $state(false);
	let saving = $state(false);
	let pendingReview: { cardId: string; rating: PracticeRating; id: string } | null = null;
	let activeRatings = $state<(typeof ratings)[number][]>([...ratings]);

	// Refresh at the UTC day boundary, including tabs left open overnight.
	onMount(() => {
		let day = practiceDay();
		const timer = setInterval(async () => {
			const today = practiceDay();
			if (saving || day === today) return;
			try {
				await refreshPractice();
				day = today;
				flipped = false;
			} catch (error) {
				console.error('Could not refresh daily practice', error);
			}
		}, 60_000);
		return () => clearInterval(timer);
	});

	const responses = [
		{
			value: 1,
			icon: Frown,
			label: 'Not at all',
			color: 'text-red-400',
			tooltip: ratings[1]
		},
		{
			value: 2,
			icon: Meh,
			label: 'Struggling',
			color: 'text-orange-400',
			tooltip: ratings[2]
		},
		{
			value: 3,
			icon: Smile,
			label: 'Got it!',
			color: 'text-green-400',
			tooltip: ratings[3]
		},
		{
			value: 4,
			icon: Laugh,
			label: 'Very Fast',
			color: 'text-emerald-400',
			tooltip: ratings[4]
		}
	] as const;

	const filteredFlashcards = $derived(
		flashcards
			? flashcards.filter(
					(flashcard) =>
						activeRatings.includes(flashcard.rating) ||
						(reviewState?.retryFlashcardIds ?? []).includes(flashcard.id)
				)
			: []
	);

	const reviewedFlashcardIds = $derived(reviewState?.reviewedFlashcardIds ?? []);
	const remainingFlashcards = $derived(
		practiceQueue(filteredFlashcards, reviewedFlashcardIds, reviewState?.retryFlashcardIds ?? [])
	);
	const reviewedCount = $derived(filteredFlashcards.length - remainingFlashcards.length);
	const currentFlashcard = $derived(remainingFlashcards[0] ?? null);

	watch(
		() => currentFlashcard?.id,
		() => {
			if (!currentFlashcard) {
				flipped = false;
				return;
			}

			flipped = false;
		}
	);

	function toggleRatingFilter(rating: (typeof ratings)[number]) {
		if (activeRatings.includes(rating)) {
			activeRatings = activeRatings.filter((value) => value !== rating);
			return;
		}
		activeRatings = [...activeRatings, rating];
	}

	async function refreshPractice() {
		await Promise.all([
			getFlashCards(params.project_id).refresh(),
			getFlashcardReviewState(params.project_id).refresh()
		]);
	}

	async function handleRating(rating: PracticeRating) {
		if (!currentFlashcard || saving || !flipped) return;
		saving = true;
		const cardId = currentFlashcard.id;
		if (pendingReview?.cardId !== cardId || pendingReview.rating !== rating) {
			pendingReview = { cardId, rating, id: crypto.randomUUID() };
		}
		try {
			await reviewFlashcard({
				flashcardId: cardId,
				rating,
				projectId: params.project_id,
				reviewId: pendingReview.id
			});
			await refreshPractice();
			pendingReview = null;
			flipped = false;
		} catch (error) {
			console.error(error);
			toast.error('Could not finish saving your response. Try again.');
		} finally {
			saving = false;
		}
	}

	async function handleReset() {
		if (saving) return;
		saving = true;
		try {
			await resetFlashcardReviewState(params.project_id);
			await refreshPractice();
			pendingReview = null;
			flipped = false;
		} catch (error) {
			console.error(error);
			toast.error('Could not restart practice. Try again.');
		} finally {
			saving = false;
		}
	}
</script>

<div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<ToolHeading>
			<Copy /> Flashcard Practice
		</ToolHeading>
		<div class="flex flex-wrap items-center gap-2">
			<Popover.Root>
				<Popover.Trigger openOnHover class={buttonVariants({ variant: 'outline' })}
					><ListFilter /> Filter</Popover.Trigger
				>
				<Popover.Content align="start" class="flex flex-col gap-1 p-2">
					{#each ratings as r (r)}
						<div class="flex items-center-safe gap-2 rounded-md p-1 hover:bg-muted">
							<Switch
								disabled={saving}
								checked={activeRatings.includes(r)}
								id={r}
								onCheckedChange={() => toggleRatingFilter(r)}
							/>
							<Label for={r}>{r} ({(flashcards ?? []).filter((f) => f.rating === r).length})</Label>
						</div>
					{/each}
					<Button variant="outline" size="sm" onclick={handleReset} disabled={saving}>
						<RefreshCcw />
						Restart Practice
					</Button>
				</Popover.Content>
			</Popover.Root>

			<a
				href={resolve('/app/project/[project_id]/flashcards/manage', params)}
				class={buttonVariants({ variant: 'outline' })}
			>
				<Settings2 />
				Manage Flashcards
			</a>
		</div>
	</div>

	<p class="mt-2 text-sm text-muted-foreground">
		Practice resets daily at midnight UTC. Difficult cards stay in the queue until you recall them.
	</p>
	<div class="mx-auto my-4 max-w-lg">
		{#if flashcards != null && currentFlashcard}
			<p class="my-2 text-center font-bold text-muted-foreground">
				{reviewedCount} of {filteredFlashcards.length} learned · {remainingFlashcards.length} remaining
			</p>
			<Flashcard flashcard={currentFlashcard} bind:flipped disabled={saving} />
			<p class="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">
				{saving
					? 'Saving response…'
					: 'Missed or difficult cards return after the other cards. Rate Good or Easy to finish a card.'}
			</p>

			{#if flipped}
				<div transition:fade={{ duration: 100, easing: cubicInOut }}>
					<h1 class="mb-2 text-center font-bold">How well could you recall this flashcard?</h1>
					<div class="grid grid-cols-4 gap-4">
						{#each responses as response (response.value)}
							{@const Icon = response.icon}
							{@const isCurrentRating = currentFlashcard?.rating === response.tooltip}

							<Tooltip.Provider delayDuration={100}>
								<Tooltip.Root>
									<Tooltip.Trigger
										disabled={saving}
										onclick={() => handleRating(response.tooltip)}
										aria-pressed={isCurrentRating}
										class={cn(
											buttonVariants({ variant: 'outline' }),
											isCurrentRating && 'border-primary bg-primary/5'
										)}
									>
										<Icon class={response.color} />
										<span class={cn(isCurrentRating && response.color)}>{response.label}</span>
									</Tooltip.Trigger>
									<Tooltip.Content side="bottom">
										<p>
											{response.tooltip}
										</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/each}
					</div>
				</div>
			{/if}
		{:else if flashcards != null && filteredFlashcards.length > 0}
			<div class="my-6 flex flex-col items-center gap-3 text-center">
				<p class="font-semibold">You learned every card in this practice session.</p>
				<p class="text-sm text-muted-foreground">
					Your ratings were saved. A fresh session starts each day at midnight UTC, or you can
					restart now.
				</p>
				<Button variant="outline" onclick={handleReset} disabled={saving}>
					<RefreshCcw />
					Restart Practice
				</Button>
			</div>
		{:else if flashcards != null}
			<Empty.Root class="border border-dashed">
				<Empty.Header>
					<Empty.Media variant="icon">
						<CopyX />
					</Empty.Media>
					<Empty.Title>No flashcards</Empty.Title>
					<Empty.Description
						>{flashcards.length === 0
							? 'Create flashcards to start practicing.'
							: 'No cards match the selected filters.'}</Empty.Description
					>
				</Empty.Header>
			</Empty.Root>
		{/if}
	</div>
</div>
