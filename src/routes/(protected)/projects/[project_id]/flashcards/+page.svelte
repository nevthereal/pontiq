<script lang="ts">
	import { resolve } from '$app/paths';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';

	import {
		applyRating,
		getFlashcardReviewState,
		getFlashCards,
		markFlashcardReviewed,
		resetFlashcardReviewState
	} from '$lib/remote/tools.remote';
	import { cn } from '$lib/utils';
	import { ratings } from '$lib/things';
	import {
		CreditCard,
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
	let activeRatings = $state<(typeof ratings)[number][]>([...ratings]);

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
		flashcards ? flashcards.filter((flashcard) => activeRatings.includes(flashcard.rating)) : []
	);

	const reviewedFlashcardIds = $derived(reviewState?.reviewedFlashcardIds ?? []);
	const reviewedFlashcardIdSet = $derived(new Set(reviewedFlashcardIds));
	const remainingFlashcards = $derived(
		filteredFlashcards.filter((flashcard) => !reviewedFlashcardIdSet.has(flashcard.id))
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

	async function handleRating(rating: (typeof ratings)[number]) {
		if (!currentFlashcard) return;

		await applyRating({ flashcardId: currentFlashcard.id, rating, projectId: params.project_id });
		await markFlashcardReviewed({ flashcardId: currentFlashcard.id, projectId: params.project_id });
		await Promise.all([
			getFlashCards(params.project_id).refresh(),
			getFlashcardReviewState(params.project_id).refresh()
		]);
	}

	async function handleReset() {
		await resetFlashcardReviewState(params.project_id);
		await getFlashcardReviewState(params.project_id).refresh();
	}
</script>

<div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<ToolHeading>
			<CreditCard /> Flashcards
		</ToolHeading>
		<div class="flex flex-wrap items-center gap-2">
			<a
				href={resolve('/(protected)/projects/[project_id]/flashcards/manage', params)}
				class={cn(buttonVariants({ variant: 'outline' }), 'my-2')}
			>
				<Settings2 />
				Manage Flashcards
			</a>
			<Popover.Root>
				<Popover.Trigger openOnHover class={cn(buttonVariants({ variant: 'outline' }), 'my-2')}
					><ListFilter /> Filter</Popover.Trigger
				>
				<Popover.Content align="start" class="flex flex-col gap-1 p-2">
					{#each ratings as r (r)}
						<div class="flex items-center-safe gap-2 rounded-md p-1 hover:bg-muted">
							<Switch
								checked={activeRatings.includes(r)}
								id={r}
								onCheckedChange={() => toggleRatingFilter(r)}
							/>
							<Label for={r}>{r} ({(flashcards ?? []).filter((f) => f.rating === r).length})</Label>
						</div>
					{/each}
				</Popover.Content>
			</Popover.Root>
			<Button variant="outline" class="my-2" onclick={handleReset}>
				<RefreshCcw />
				Reset Progress
			</Button>
		</div>
	</div>

	<div class="mx-auto my-4 max-w-lg">
		{#if flashcards != null && currentFlashcard}
			<p class="my-2 text-center font-bold text-muted-foreground">
				Card {reviewedCount + 1} of {filteredFlashcards.length}
			</p>
			<Flashcard flashcard={currentFlashcard} bind:flipped />

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
				<p class="font-semibold">You reviewed every flashcard in this session.</p>
				<p class="text-sm text-muted-foreground">
					Your ratings were saved. Reset progress to start another pass.
				</p>
				<Button variant="outline" onclick={handleReset}>
					<RefreshCcw />
					Reset Progress
				</Button>
			</div>
		{:else if flashcards != null}
			<p class="my-6 text-center text-muted-foreground">
				{flashcards.length === 0
					? 'No cards due right now.'
					: 'No cards match the selected filters.'}
			</p>
		{/if}
	</div>
</div>
