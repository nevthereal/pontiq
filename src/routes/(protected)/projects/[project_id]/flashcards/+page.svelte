<script lang="ts">
	import Flashcard from '$lib/components/Flashcard.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';

	import { getProjectDetails } from '$lib/remote/projects.remote';
	import { applyRating, getFlashCards } from '$lib/remote/tools.remote';
	import { cn, ratings } from '$lib/utils';
	import { CreditCard, Frown, Laugh, ListFilter, Meh, Smile } from '@lucide/svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { watch } from 'runed';

	let { params } = $props();

	const flashcards = $derived(await getFlashCards(params.project_id));
	const projectDetails = $derived(await getProjectDetails(params.project_id));

	let currentIndex = $state(0);
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

	const currentFlashcard = $derived(filteredFlashcards[currentIndex] ?? null);

	watch(
		() => filteredFlashcards,
		() => {
			if (currentIndex >= filteredFlashcards.length) {
				currentIndex = 0;
			}
			if (!currentFlashcard) {
				flipped = false;
			}
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
		console.log(rating);
		await applyRating({ flashcardId: currentFlashcard.id, rating });
		getFlashCards(params.project_id).refresh();
		flipped = false;
		currentIndex++;
	}
</script>

<div>
	<ToolHeading>
		<CreditCard /> Flashcards
	</ToolHeading>
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
					<Label for={r}>{r} ({flashcards.filter((f) => f.rating === r).length})</Label>
				</div>
			{/each}
		</Popover.Content>
	</Popover.Root>

	<div class="mx-auto my-4 max-w-lg">
		{#if flashcards != null && currentFlashcard}
			<p class="my-2 text-center font-bold text-muted-foreground">
				{currentIndex + 1} / {filteredFlashcards.length}
			</p>
			<Flashcard flashcard={currentFlashcard} bind:flipped />

			{#if flipped}
				<div transition:fade={{ duration: 100, easing: cubicInOut }}>
					<h1 class="mb-2 text-center font-bold">How well could you recall this flashcard?</h1>
					<div class="grid grid-cols-4 gap-4">
						{#each responses as response (response.value)}
							{@const Icon = response.icon}

							<Tooltip.Provider delayDuration={100}>
								<Tooltip.Root>
									<Tooltip.Trigger
										onclick={() => handleRating(response.tooltip)}
										class={buttonVariants({ variant: 'outline' })}
									>
										<Icon class={response.color} />
										{response.label}
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>{response.tooltip}</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/each}
					</div>
				</div>
			{/if}
		{:else if flashcards != null}
			<p class="my-6 text-center text-muted-foreground">
				{flashcards.length === 0
					? 'No cards due right now.'
					: 'No cards match the selected filters.'}
			</p>
		{/if}
	</div>
</div>
