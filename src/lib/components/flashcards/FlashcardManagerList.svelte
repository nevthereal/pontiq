<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import type { Flashcard } from '$lib/server/db/schema';

	let {
		flashcards,
		selectedId,
		search,
		onSearchChange,
		onSelect,
		onCreateNew,
		onDelete,
		onDeleteAll
	}: {
		flashcards: Flashcard[];
		selectedId: string | null;
		search: string;
		onSearchChange: (value: string) => void;
		onSelect: (id: string) => void;
		onCreateNew: () => void;
		onDelete: (flashcard: Flashcard) => void;
		onDeleteAll: () => void;
	} = $props();

	function getSourceLabel(source: Flashcard['source']) {
		return source === 'manual' ? 'Manual' : 'AI';
	}
</script>

<div class="flex h-full min-h-0 flex-col rounded-xl border bg-card">
	<div class="flex flex-col gap-3 border-b p-4">
		<div class="flex items-center justify-between gap-2">
			<div>
				<h2 class="font-semibold">Flashcards</h2>
				<p class="text-sm text-muted-foreground">{flashcards.length} total</p>
			</div>
			<Button type="button" size="sm" onclick={onCreateNew}>New</Button>
		</div>
		<Input
			type="search"
			placeholder="Search term or definition"
			value={search}
			oninput={(event) => onSearchChange(event.currentTarget.value)}
		/>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto p-3">
		{#if flashcards.length}
			<ul class="space-y-2">
				{#each flashcards as card (card.id)}
					<li class="flex items-start gap-2">
						<Item.Root
							class="select-none"
							variant={selectedId === card.id ? 'outline' : 'muted'}
							onclick={() => onSelect(card.id)}
						>
							<Item.Header>{card.term}</Item.Header>
							<Item.Content>
								<Item.Description>
									{card.definition}
								</Item.Description>
							</Item.Content>
							<Item.Actions>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									class="mt-1 shrink-0"
									title={`Delete ${card.term}`}
									onclick={() => onDelete(card)}
								>
									<Trash2 />
								</Button>
							</Item.Actions>
							<Item.Footer>{card.rating}, created by {getSourceLabel(card.source)}</Item.Footer>
						</Item.Root>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
				No flashcards match this view.
			</div>
		{/if}
	</div>

	<div class="border-t p-4">
		<AlertDialog.Root>
			<AlertDialog.Trigger
				class={buttonVariants({ variant: 'destructive', class: 'w-full' })}
				disabled={!flashcards.length}>Delete All Flashcards</AlertDialog.Trigger
			>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Delete all flashcards?</AlertDialog.Title>
					<AlertDialog.Description>
						This removes every flashcard in this project. This action cannot be undone.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<AlertDialog.Action onclick={onDeleteAll}>Delete all</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</div>
</div>
