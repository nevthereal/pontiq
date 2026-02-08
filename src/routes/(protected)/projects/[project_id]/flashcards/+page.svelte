<script lang="ts">
	import Flashcard from '$lib/components/Flashcard.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import { getFlashCards, reviewFlashcard } from '$lib/remote/tools.remote';
	import { getProjectDetails } from '$lib/remote/projects.remote';
	import { applySrsReview, type ReviewRating } from '$lib/srs';
	import { CreditCard, Frown, Laugh, Meh, Smile } from '@lucide/svelte';
	import { PressedKeys } from 'runed';
	import { cubicInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	let { params } = $props();

	const keys = new PressedKeys();

	const flashcards = $derived(await getFlashCards(params.project_id));
	const projectDetails = $derived(await getProjectDetails(params.project_id));

	let currentIndex = $state(0);
	let flipped = $state(false);
	const MS_PER_DAY = 1000 * 60 * 60 * 24;

	const responses = [
		{ value: 1, icon: Frown, label: 'Not at all', color: 'text-red-400', tooltip: 'Again' },
		{ value: 2, icon: Meh, label: 'Struggling', color: 'text-orange-400', tooltip: 'Hard' },
		{ value: 3, icon: Smile, label: 'Got it!', color: 'text-green-400', tooltip: 'Good' },
		{ value: 4, icon: Laugh, label: 'Very Fast', color: 'text-emerald-400', tooltip: 'Easy' }
	];

	const currentFlashcard = $derived(flashcards?.[currentIndex] ?? null);
	const examDate = $derived(projectDetails?.examDate ?? null);

	function formatDueEstimate(date: Date) {
		const now = new Date();
		const diffDays = Math.round((date.getTime() - now.getTime()) / MS_PER_DAY);
		const when = diffDays <= 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`;
		const label = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date);
		return `${when} (${label})`;
	}

	function estimateNextDue(rating: ReviewRating) {
		if (!currentFlashcard) return '';
		const next = applySrsReview(
			{
				easeFactor: currentFlashcard.easeFactor,
				intervalDays: currentFlashcard.intervalDays,
				repetitions: currentFlashcard.repetitions,
				lapses: currentFlashcard.lapses
			},
			rating,
			new Date(),
			examDate
		);
		return formatDueEstimate(next.dueAt);
	}

	async function handleSubmission(index: number) {
		if (!currentFlashcard) return;
		await reviewFlashcard({
			projectId: params.project_id,
			flashcardId: currentFlashcard.id,
			rating: index
		});
		if (flashcards && currentIndex < flashcards.length - 1) {
			currentIndex++;
		} else {
			currentIndex = 0;
		}
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
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button onclick={() => handleSubmission(response.value)} variant="outline">
											<Icon class={response.color} />
											{response.label}
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content side="top">
										{response.tooltip} · {estimateNextDue(response.value)}
									</Tooltip.Content>
								</Tooltip.Root>
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
