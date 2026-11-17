<script lang="ts">
	import FlashcardImageUpload from './FlashcardImageUpload.svelte';
	import { toast } from 'svelte-sonner';
	import { CircleCheck } from '@lucide/svelte';
	import { createFlashcard, updateFlashcard } from '#lib/remote/tools.remote.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import Input from '#lib/components/ui/input/input.svelte';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import * as Field from '#lib/components/ui/field/index.ts';
	import type { Flashcard } from '#lib/server/db/schema/index.ts';

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

	let term = $derived(selectedFlashcard?.term ?? '');
	let definition = $derived(selectedFlashcard?.definition ?? '');
	let termImageUrl = $derived(selectedFlashcard?.termImageUrl ?? '');
	let definitionImageUrl = $derived(selectedFlashcard?.definitionImageUrl ?? '');
	let submitting = $state(false);
	let termUploading = $state(false);
	let definitionUploading = $state(false);
	const busy = $derived(submitting || termUploading || definitionUploading);

	const isCreating = $derived(selectedFlashcard == null);

	async function handleCreateSubmit(submit: () => Promise<boolean>) {
		if (busy) return;
		submitting = true;
		try {
			if (!(await submit())) return;
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

	async function handleUpdateSubmit(submit: () => Promise<boolean>) {
		if (busy) return;
		submitting = true;
		try {
			if (!(await submit())) return;
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
			<input {...createFlashcard.fields.projectId.as('hidden', projectId)} />
			<Field.Field>
				<Field.Label for="term">Term</Field.Label>
				<Input {...createFlashcard.fields.term.as('text')} id="term" bind:value={term} />
				{#if createFlashcard.fields.term.issues()}
					{#each createFlashcard.fields.term.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="definition">Definition</Field.Label>
				<Textarea
					{...createFlashcard.fields.definition.as('text')}
					id="definition"
					rows={7}
					bind:value={definition}
				/>
				{#if createFlashcard.fields.definition.issues()}
					{#each createFlashcard.fields.definition.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<input {...createFlashcard.fields.termImageUrl.as('hidden', termImageUrl)} />
			<input {...createFlashcard.fields.definitionImageUrl.as('hidden', definitionImageUrl)} />
			{#key `${projectId}:${selectedFlashcard?.id ?? 'new'}`}
				<FlashcardImageUpload
					{projectId}
					label="Term image"
					bind:value={termImageUrl}
					bind:uploading={termUploading}
					disabled={submitting || definitionUploading}
				/>
				<FlashcardImageUpload
					{projectId}
					label="Definition image"
					bind:value={definitionImageUrl}
					bind:uploading={definitionUploading}
					disabled={submitting || termUploading}
				/>
			{/key}
			<Button type="submit" disabled={busy}>
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
			<input {...updateFlashcard.fields.id.as('hidden', selectedFlashcard.id)} />
			<input {...updateFlashcard.fields.projectId.as('hidden', projectId)} />
			<Field.Field>
				<Field.Label for="edit-term">Term</Field.Label>
				<Input {...updateFlashcard.fields.term.as('text')} id="edit-term" bind:value={term} />
				{#if updateFlashcard.fields.term.issues()}
					{#each updateFlashcard.fields.term.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="edit-definition">Definition</Field.Label>
				<Textarea
					{...updateFlashcard.fields.definition.as('text')}
					id="edit-definition"
					rows={7}
					bind:value={definition}
				/>
				{#if updateFlashcard.fields.definition.issues()}
					{#each updateFlashcard.fields.definition.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<input {...updateFlashcard.fields.termImageUrl.as('hidden', termImageUrl)} />
			<input {...updateFlashcard.fields.definitionImageUrl.as('hidden', definitionImageUrl)} />
			{#key `${projectId}:${selectedFlashcard?.id ?? 'new'}`}
				<FlashcardImageUpload
					{projectId}
					label="Term image"
					bind:value={termImageUrl}
					bind:uploading={termUploading}
					disabled={submitting || definitionUploading}
				/>
				<FlashcardImageUpload
					{projectId}
					label="Definition image"
					bind:value={definitionImageUrl}
					bind:uploading={definitionUploading}
					disabled={submitting || termUploading}
				/>
			{/key}
			<Button type="submit" disabled={busy}>
				<CircleCheck />
				{submitting ? 'Saving…' : 'Save Changes'}
			</Button>
		</form>
	{/if}
</div>
