<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { toast } from 'svelte-sonner';
	import { CircleCheck } from '@lucide/svelte';
	import { createStudyStep, updateStudyStep } from '$lib/remote/tools.remote';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Field from '$lib/components/ui/field';
	import { studyStepTypes, type StudyStepType } from '$lib/things';
	import type { StudyPlanStep } from '$lib/server/db/schema';

	let {
		projectId,
		selectedStep,
		onCreated,
		onUpdated
	}: {
		projectId: string;
		selectedStep: StudyPlanStep | null;
		onCreated: (step: StudyPlanStep) => void;
		onUpdated: (step: StudyPlanStep) => void;
	} = $props();

	let title = $state('');
	let description = $state('');
	let date = $state('');
	let type = $state<StudyStepType>('lesson');
	let submitting = $state(false);

	function toDateInputValue(value: Date | null | undefined) {
		if (!value) return '';

		const year = value.getFullYear();
		const month = `${value.getMonth() + 1}`.padStart(2, '0');
		const day = `${value.getDate()}`.padStart(2, '0');

		return `${year}-${month}-${day}`;
	}

	$effect(() => {
		title = selectedStep?.title ?? '';
		description = selectedStep?.description ?? '';
		date = toDateInputValue(selectedStep?.date);
		type = selectedStep?.type ?? 'lesson';
	});

	const isCreating = $derived(selectedStep == null);

	async function handleCreateSubmit(submit: () => Promise<void>) {
		submitting = true;
		try {
			await submit();
			const createdStep = createStudyStep.result;
			if (!createdStep) throw new Error('Missing created study step result');
			onCreated(createdStep);
			toast.success('Study step created');
		} catch (submissionError) {
			console.error(submissionError);
			toast.error('Failed to create study step');
		} finally {
			submitting = false;
		}
	}

	async function handleUpdateSubmit(submit: () => Promise<void>) {
		submitting = true;
		try {
			await submit();
			const updatedStep = updateStudyStep.result;
			if (!updatedStep) throw new Error('Missing updated study step result');
			onUpdated(updatedStep);
			toast.success('Study step updated');
		} catch (submissionError) {
			console.error(submissionError);
			toast.error('Failed to update study step');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="rounded-xl border bg-card p-4">
	<div class="mb-4">
		<h2 class="font-semibold">{isCreating ? 'Create Study Step' : 'Edit Study Step'}</h2>
		<p class="text-sm text-muted-foreground">
			{#if isCreating}
				Add a manual step to the project timeline.
			{:else}
				Saving re-sorts the study plan automatically by ascending date.
			{/if}
		</p>
	</div>

	{#if isCreating}
		<form
			{...createStudyStep.enhance(async ({ submit }) => {
				await handleCreateSubmit(submit);
			})}
			class="space-y-4"
		>
			<input type="hidden" name="projectId" value={projectId} />
			<Field.Field>
				<Field.Label for="title">Title</Field.Label>
				<Input id="title" name="title" bind:value={title} />
				{#if createStudyStep.fields.title.issues()}
					{#each createStudyStep.fields.title.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="description">Description</Field.Label>
				<Textarea id="description" name="description" rows={7} bind:value={description} />
				{#if createStudyStep.fields.description.issues()}
					{#each createStudyStep.fields.description.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<div class="grid gap-4 sm:grid-cols-2">
				<Field.Field>
					<Field.Label for="date">Date</Field.Label>
					<Input id="date" name="date" type="date" bind:value={date} />
					{#if createStudyStep.fields.date.issues()}
						{#each createStudyStep.fields.date.issues() as issue, idx (idx)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="type">Type</Field.Label>
					<select
						id="type"
						name="type"
						bind:value={type}
						class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
					>
						{#each studyStepTypes as option (option)}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</Field.Field>
			</div>
			<Button type="submit" disabled={submitting}>
				<CircleCheck />
				{submitting ? 'Saving…' : 'Create Study Step'}
			</Button>
		</form>
	{:else if selectedStep}
		<form
			{...updateStudyStep.enhance(async ({ submit }) => {
				await handleUpdateSubmit(submit);
			})}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={selectedStep.id} />
			<input type="hidden" name="projectId" value={projectId} />
			<Field.Field>
				<Field.Label for="edit-title">Title</Field.Label>
				<Input id="edit-title" name="title" bind:value={title} />
				{#if updateStudyStep.fields.title.issues()}
					{#each updateStudyStep.fields.title.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="edit-description">Description</Field.Label>
				<Textarea id="edit-description" name="description" rows={7} bind:value={description} />
				{#if updateStudyStep.fields.description.issues()}
					{#each updateStudyStep.fields.description.issues() as issue, idx (idx)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				{/if}
			</Field.Field>
			<div class="grid gap-4 sm:grid-cols-2">
				<Field.Field>
					<Field.Label for="edit-date">Date</Field.Label>
					<Input id="edit-date" name="date" type="date" bind:value={date} />
					{#if updateStudyStep.fields.date.issues()}
						{#each updateStudyStep.fields.date.issues() as issue, idx (idx)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="edit-type">Type</Field.Label>
					<Select.Root name="type" bind:value={type} type="single">
						<Select.Trigger>{type}</Select.Trigger>
						<Select.Content id="edit-type">
							{#each studyStepTypes as option (option)}
								<Select.Item value={option}>{option}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</div>
			<Button type="submit" disabled={submitting}>
				<CircleCheck />
				{submitting ? 'Saving…' : 'Save Changes'}
			</Button>
		</form>
	{/if}
</div>
