<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, Settings2 } from '@lucide/svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Loading from '$lib/components/typography/Loading.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import FlashcardEditorForm from '$lib/components/flashcards/FlashcardEditorForm.svelte';
	import FlashcardManagerList from '$lib/components/flashcards/FlashcardManagerList.svelte';
	import { deleteAllFlashcards, deleteFlashcard, getFlashCards } from '$lib/remote/tools.remote';
	import type { Flashcard } from '$lib/server/db/schema';

	let { params } = $props();

	const flashcardsQuery = $derived(getFlashCards(params.project_id));
	const flashcardsResult = $derived(await flashcardsQuery);

	let search = $state('');
	let flashcards = $state<Flashcard[]>([]);
	let selectedId = $state<string | null>(null);
	let isCreating = $state(false);

	const filteredFlashcards = $derived(
		flashcards.filter((card) => {
			const query = search.trim().toLowerCase();
			if (!query.length) return true;

			return (
				card.term.toLowerCase().includes(query) || card.definition.toLowerCase().includes(query)
			);
		})
	);

	const selectedFlashcard = $derived(flashcards.find((card) => card.id === selectedId) ?? null);
	const preferredFlashcardId = $derived(page.url.searchParams.get('flashcard'));

	$effect(() => {
		const nextFlashcards = flashcardsResult ?? [];
		flashcards = nextFlashcards;

		if (selectedId && nextFlashcards.some((card) => card.id === selectedId)) return;
		if (isCreating) return;

		const preferredCard = preferredFlashcardId
			? nextFlashcards.find((card) => card.id === preferredFlashcardId)
			: null;

		selectedId = preferredCard?.id ?? nextFlashcards[0]?.id ?? null;
		isCreating = selectedId == null;
	});

	function selectFlashcard(id: string) {
		selectedId = id;
		isCreating = false;
	}

	function openCreateForm() {
		selectedId = null;
		isCreating = true;
	}

	function handleCreated(flashcard: Flashcard) {
		flashcards = [...flashcards, flashcard].sort((left, right) => {
			if (left.createdAt.getTime() !== right.createdAt.getTime()) {
				return left.createdAt.getTime() - right.createdAt.getTime();
			}

			return left.id.localeCompare(right.id);
		});
		selectedId = flashcard.id;
		isCreating = false;
	}

	function handleUpdated(updatedFlashcard: Flashcard) {
		flashcards = flashcards.map((card) =>
			card.id === updatedFlashcard.id ? updatedFlashcard : card
		);
		selectedId = updatedFlashcard.id;
		isCreating = false;
	}

	function selectNeighborAfterDelete(currentId: string) {
		const currentIndex = flashcards.findIndex((card) => card.id === currentId);
		const nextCard = flashcards[currentIndex + 1] ?? flashcards[currentIndex - 1] ?? null;

		if (nextCard) {
			selectedId = nextCard.id;
			isCreating = false;
			return;
		}

		selectedId = null;
		isCreating = true;
	}

	async function handleDelete(flashcard: Flashcard) {
		if (selectedId === flashcard.id) {
			selectNeighborAfterDelete(flashcard.id);
		}

		try {
			await deleteFlashcard({ id: flashcard.id, projectId: params.project_id }).updates(
				flashcardsQuery.withOverride((currentFlashcards) =>
					currentFlashcards.filter((card) => card.id !== flashcard.id)
				)
			);
		} catch (deleteError) {
			console.error(deleteError);
			toast.error('Failed to delete flashcard');
		}
	}

	async function handleDeleteAll() {
		await toast.promise(deleteAllFlashcards(params.project_id), {
			loading: 'Deleting flashcards…',
			success: 'All flashcards deleted',
			error: 'Failed to delete flashcards'
		});

		flashcards = [];
		selectedId = null;
		isCreating = true;
	}
</script>

<div class="space-y-4 lg:flex lg:min-h-0 lg:flex-col">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<ToolHeading>
				<Settings2 /> Manage Flashcards
			</ToolHeading>
		</div>
		<a
			href={resolve('/(protected)/projects/[project_id]/flashcards', params)}
			class={buttonVariants({ variant: 'outline' })}
		>
			<ArrowLeft />
			Back To Review
		</a>
	</div>

	<svelte:boundary>
		{#snippet pending()}
			<Loading thing="flashcards" />
		{/snippet}

		<div
			class="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:overflow-hidden"
		>
			<FlashcardManagerList
				flashcards={filteredFlashcards}
				{selectedId}
				{search}
				onSearchChange={(value) => (search = value)}
				onSelect={selectFlashcard}
				onCreateNew={openCreateForm}
				onDelete={handleDelete}
				onDeleteAll={handleDeleteAll}
			/>
			<FlashcardEditorForm
				projectId={params.project_id}
				{selectedFlashcard}
				onCreated={handleCreated}
				onUpdated={handleUpdated}
			/>
		</div>
	</svelte:boundary>
</div>
