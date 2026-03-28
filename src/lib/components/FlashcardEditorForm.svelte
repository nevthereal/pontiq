<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { CircleCheck } from '@lucide/svelte';
	import { createFlashcard, updateFlashcard } from '$lib/remote/tools.remote';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Field from '$lib/components/ui/field';
	import type { Flashcard } from '$lib/server/db/schema';

	let {
		projectId,
		selectedFlashcard,
		onCreated,
		onUpdated
	}: {
		projectId: string;
		selectedFlashcard: Flashcard | null;
		onCreated: (flashcard: Flashcard) => void;
		onUpdated: (flashcard: Flashcard) => void;
	} = $props();

	let term = $state('');
	let definition = $state('');
	let submitting = $state(false);

	$effect(() => {
		term = selectedFlashcard?.term ?? '';
		definition = selectedFlashcard?.definition ?? '';
	});

	const isCreating = $derived(selectedFlashcard == null);

	async function handleCreateSubmit(submit: () => Promise<void>) {
		submitting = true;
		try {
			await submit();
			const createdFlashcard = createFlashcard.result;
			if (!createdFlashcard) throw new Error('Missing created flashcard result');
			onCreated(createdFlashcard);
			toast.success('Flashcard created');
		} catch (submissionError) {
			console.error(submissionError);
			toast.error('Failed to create flashcard');
		} finally {
			submitting = false;
		}
	}

	async function handleUpdateSubmit(submit: () => Promise<void>) {
		submitting = true;
		try {
			await submit();
			const updatedFlashcard = updateFlashcard.result;
			if (!updatedFlashcard) throw new Error('Missing updated flashcard result');
			onUpdated(updatedFlashcard);
			toast.success('Flashcard updated');
		} catch (submissionError) {
			console.error(submissionError);
			toast.error('Failed to update flashcard');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="rounded-xl border bg-card p-4">
	<div class="mb-4">
		<h2 class="font-semibold">{isCreating ? 'Create Flashcard' : 'Edit Flashcard'}</h2>
		<p class="text-sm text-muted-foreground">
			{#if isCreating}
				Add a manual flashcard for this project.
			{:else}
				Saving resets this card to `Unrated` and makes it reviewable again.
			{/if}
		</p>
	</div>

	{#if isCreating}
		<form
			{...createFlashcard.enhance(async ({ submit }) => {
				await handleCreateSubmit(submit);
			})}
			class="space-y-4"
		>
			<input type="hidden" name="projectId" value={projectId} />
			<Field.Field>
				<Field.Label for="term">Term</Field.Label>
				<Input id="term" name="term" bind:value={term} />
				{#if createFlashcard.fields.term.issues()}
					{#each createFlashcard.fields.term.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="definition">Definition</Field.Label>
				<Textarea id="definition" name="definition" rows={7} bind:value={definition} />
				{#if createFlashcard.fields.definition.issues()}
					{#each createFlashcard.fields.definition.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<Button type="submit" disabled={submitting}>
				<CircleCheck />
				{submitting ? 'Saving…' : 'Create Flashcard'}
			</Button>
		</form>
	{:else if selectedFlashcard}
		<form
			{...updateFlashcard.enhance(async ({ submit }) => {
				await handleUpdateSubmit(submit);
			})}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={selectedFlashcard.id} />
			<input type="hidden" name="projectId" value={projectId} />
			<Field.Field>
				<Field.Label for="edit-term">Term</Field.Label>
				<Input id="edit-term" name="term" bind:value={term} />
				{#if updateFlashcard.fields.term.issues()}
					{#each updateFlashcard.fields.term.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="edit-definition">Definition</Field.Label>
				<Textarea id="edit-definition" name="definition" rows={7} bind:value={definition} />
				{#if updateFlashcard.fields.definition.issues()}
					{#each updateFlashcard.fields.definition.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<Button type="submit" disabled={submitting}>
				<CircleCheck />
				{submitting ? 'Saving…' : 'Save Changes'}
			</Button>
		</form>
	{/if}
</div>
