<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import type { StudyPlanStep } from '$lib/server/db/schema';

	let {
		steps,
		selectedId,
		search,
		onSearchChange,
		onSelect,
		onCreateNew,
		onDelete,
		onDeleteAll
	}: {
		steps: StudyPlanStep[];
		selectedId: string | null;
		search: string;
		onSearchChange: (value: string) => void;
		onSelect: (id: string) => void;
		onCreateNew: () => void;
		onDelete: (step: StudyPlanStep) => void;
		onDeleteAll: () => void;
	} = $props();

	function formatDate(date: Date) {
		return Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date);
	}

	function getSourceLabel(source: StudyPlanStep['source']) {
		return source === 'manual' ? 'Manual' : 'AI';
	}
</script>

<div class="flex h-full min-h-0 flex-col rounded-xl border bg-card">
	<div class="flex flex-col gap-3 border-b p-4">
		<div class="flex items-center justify-between gap-2">
			<div>
				<h2 class="font-semibold">Study Steps</h2>
				<p class="text-sm text-muted-foreground">{steps.length} total</p>
			</div>
			<Button type="button" size="sm" onclick={onCreateNew}>New</Button>
		</div>
		<Input
			type="search"
			placeholder="Search title or description"
			value={search}
			oninput={(event) => onSearchChange(event.currentTarget.value)}
		/>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto p-3">
		{#if steps.length}
			<ul class="space-y-2">
				{#each steps as step (step.id)}
					<li class="flex items-start gap-2">
						<Item.Root
							class="select-none"
							variant={selectedId === step.id ? 'outline' : 'muted'}
							onclick={() => onSelect(step.id)}
							><Item.Header>{step.title}</Item.Header>
							<Item.Content>
								<Item.Title>{formatDate(step.date)}</Item.Title>
								<Item.Description>
									{step.description}
								</Item.Description>
							</Item.Content>
							<Item.Actions>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									class="mt-1 shrink-0"
									title={`Delete ${step.title}`}
									onclick={() => onDelete(step)}
								>
									<Trash2 />
								</Button>
							</Item.Actions>
							<Item.Footer>{step.type}, created by {getSourceLabel(step.source)}</Item.Footer>
						</Item.Root>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
				No study steps match this view.
			</div>
		{/if}
	</div>

	<div class="border-t p-4">
		<AlertDialog.Root>
			<AlertDialog.Trigger
				class={buttonVariants({ variant: 'destructive', class: 'w-full' })}
				disabled={!steps.length}>Delete All Study Steps</AlertDialog.Trigger
			>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Delete all study steps?</AlertDialog.Title>
					<AlertDialog.Description>
						This removes the full study plan for this project. This action cannot be undone.
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
