<script lang="ts">
	import Flashcard from '$lib/components/Flashcard.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	import { getFlashCards } from '$lib/remote/tools.remote';
	import { CreditCard, Frown, Laugh, Meh, Smile } from '@lucide/svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	let { params } = $props();

	const flashcards = $derived(await getFlashCards(params.project_id));

	let currentIndex = $state(0);
	let flipped = $state(false);

	function handleSubmission(index) {
		currentIndex++;
		flipped = false;
	}
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
						<Button onclick={() => handleSubmission(1)} variant="outline"
							><Frown class="text-red-400" />Not at all</Button
						>
						<Button onclick={() => handleSubmission(2)} variant="outline"
							><Meh class="text-orange-400" />Struggling</Button
						>
						<Button onclick={() => handleSubmission(3)} variant="outline"
							><Smile class="text-green-400" />Got it!</Button
						>
						<Button onclick={() => handleSubmission(4)} variant="outline"
							><Laugh class="text-emerald-400" />Very Fast</Button
						>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
