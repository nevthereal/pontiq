<script lang="ts">
	import Flashcard from '$lib/components/Flashcard.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	import { getFlashCards } from '$lib/remote/tools.remote';
	import { CreditCard, Frown, Laugh, Meh, Smile } from '@lucide/svelte';
	import { PressedKeys } from 'runed';
	import { cubicInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	let { params } = $props();

	const keys = new PressedKeys();

	const flashcards = $derived(await getFlashCards(params.project_id));

	let currentIndex = $state(0);
	let flipped = $state(false);

	const responses = [
		{ value: 1, icon: Frown, label: 'Not at all', color: 'text-red-400' },
		{ value: 2, icon: Meh, label: 'Struggling', color: 'text-orange-400' },
		{ value: 3, icon: Smile, label: 'Got it!', color: 'text-green-400' },
		{ value: 4, icon: Laugh, label: 'Very Fast', color: 'text-emerald-400' }
	];

	function handleSubmission(index) {
		currentIndex++;
		flipped = false;
	}

	// Register keyboard shortcuts - only active when card is flipped
	responses.forEach((response) => {
		keys.onKeys([String(response.value)], () => {
			if (flipped) {
				handleSubmission(response.value);
			}
		});
	});
</script>

<div>
	<ToolHeading>
		<CreditCard /> Flashcards
	</ToolHeading>
	<div class="max-w-lg">
		{#if flashcards != null}
			<p class="my-2 text-center font-bold text-muted-foreground">
				{currentIndex + 1} / {flashcards.length}
			</p>
			<Flashcard
				front={flashcards[currentIndex].term}
				back={flashcards[currentIndex].definition}
				bind:flipped
			/>

			{#if flipped}
				<div transition:fade={{ duration: 100, easing: cubicInOut }}>
					<h1 class="mb-2 text-center font-bold">How well could you recall this flashcard?</h1>
					<div class="grid grid-cols-4 gap-4">
						{#each responses as response (response.value)}
							{@const Icon = response.icon}
							<Button onclick={() => handleSubmission(response.value)} variant="outline">
								<Icon class={response.color} />
								{response.label}
							</Button>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
