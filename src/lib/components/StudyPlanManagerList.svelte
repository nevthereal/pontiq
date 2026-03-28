<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import type { studyPlanStep } from '$lib/server/db/schema';
	import { cn } from '$lib/utils';

	type StudyPlanStep = typeof studyPlanStep.$inferSelect;

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

<div class="flex h-full flex-col rounded-xl border bg-card">
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

	<div class="flex-1 overflow-y-auto p-3">
		{#if steps.length}
			<ul class="space-y-2">
				{#each steps as step (step.id)}
					<li class="flex items-start gap-2">
						<button
							type="button"
							class={cn(
								'flex-1 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40',
								selectedId === step.id && 'border-primary bg-primary/5'
							)}
							onclick={() => onSelect(step.id)}
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="font-medium">{step.title}</p>
									<p class="mt-1 text-sm text-muted-foreground">{formatDate(step.date)}</p>
									<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
										{step.description}
									</p>
								</div>
								<div class="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
									<span>{step.type}</span>
									<span>{getSourceLabel(step.source)}</span>
								</div>
							</div>
						</button>
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
