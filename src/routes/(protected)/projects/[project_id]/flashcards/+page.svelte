<script lang="ts">
	import Flashcard from '$lib/components/Flashcard.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	import { getFlashCards } from '$lib/remote/tools.remote';
	import { ArrowLeft, ArrowRight, CreditCard } from '@lucide/svelte';

	let { params } = $props();

	const flashcards = $derived(await getFlashCards(params.project_id));

	let currentIndex = $state(0);
	let flipped = $state(false);
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

			<div class="flex justify-between">
				{#if currentIndex != 0}
					<Button
						variant="ghost"
						size="icon-lg"
						onclick={() => {
							currentIndex--;
							flipped = false;
						}}><ArrowLeft /></Button
					>
				{/if}
				{#if currentIndex + 1 != flashcards.length}
					<Button
						variant="ghost"
						size="icon-lg"
						class="ml-auto"
						onclick={() => {
							currentIndex++;
							flipped = false;
						}}><ArrowRight /></Button
					>
				{/if}
			</div>
		{/if}
	</div>
</div>
