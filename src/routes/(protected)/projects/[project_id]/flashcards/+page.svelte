<script lang="ts">
	import Flashcard from '$lib/components/Flashcard.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import { getFlashCards } from '$lib/remote/tools.remote';
	import { getProjectDetails } from '$lib/remote/projects.remote';
	import { CreditCard, Frown, Laugh, Meh, Smile } from '@lucide/svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { ratings } from '$lib/utils';

	let { params } = $props();

	const flashcards = $derived(await getFlashCards(params.project_id));
	const projectDetails = $derived(await getProjectDetails(params.project_id));

	let currentIndex = $state(0);
	let flipped = $state(false);

	const responses = [
		{
			value: 1,
			icon: Frown,
			label: 'Not at all',
			color: 'text-red-400',
			tooltip: ratings[0]
		},
		{
			value: 2,
			icon: Meh,
			label: 'Struggling',
			color: 'text-orange-400',
			tooltip: ratings[1]
		},
		{
			value: 3,
			icon: Smile,
			label: 'Got it!',
			color: 'text-green-400',
			tooltip: ratings[2]
		},
		{
			value: 4,
			icon: Laugh,
			label: 'Very Fast',
			color: 'text-emerald-400',
			tooltip: ratings[3]
		}
	] as const;

	const currentFlashcard = $derived(flashcards?.[currentIndex] ?? null);
</script>

<div>
	<ToolHeading>
		<CreditCard /> Flashcards
	</ToolHeading>
	<div class="mx-auto my-4 max-w-lg">
		{#if flashcards != null && currentFlashcard}
			<p class="my-2 text-center font-bold text-muted-foreground">
				{currentIndex + 1} / {flashcards.length}
			</p>
			<Flashcard front={currentFlashcard.term} back={currentFlashcard.definition} bind:flipped />

			{#if flipped}
				<div transition:fade={{ duration: 100, easing: cubicInOut }}>
					<h1 class="mb-2 text-center font-bold">How well could you recall this flashcard?</h1>
					<Tooltip.Provider delayDuration={100}>
						<div class="grid grid-cols-4 gap-4">
							{#each responses as response (response.value)}
								{@const Icon = response.icon}
								<Button variant="outline">
									<Icon class={response.color} />
									{response.label}
								</Button>
							{/each}
						</div>
					</Tooltip.Provider>
				</div>
			{/if}
		{:else if flashcards != null}
			<p class="my-6 text-center text-muted-foreground">No cards due right now.</p>
		{/if}
	</div>
</div>
