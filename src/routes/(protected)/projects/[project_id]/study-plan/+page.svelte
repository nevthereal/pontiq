<script lang="ts">
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	import { deleteAllStudySteps, getStudySteps } from '$lib/remote/tools.remote';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Maximize2, NotebookPen, RefreshCcw, Settings2, Trash2 } from '@lucide/svelte';
	import Muted from '$lib/components/typography/Muted.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Loading from '$lib/components/typography/Loading.svelte';

	let { params } = $props();

	let open = $state(false);
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<ToolHeading>
			<NotebookPen /> Study Plan
		</ToolHeading>
		<p class="text-sm text-muted-foreground">Overview and step details for the current plan.</p>
	</div>
	<div class="flex items-center gap-2">
		<a
			href={resolve('/(protected)/projects/[project_id]/study-plan/manage', params)}
			class={buttonVariants({ variant: 'outline' })}
		>
			<Settings2 />
			Manage Study Plan
		</a>
		<Button
			variant="outline"
			size="icon-sm"
			title="Refresh steps"
			onclick={async () => await getStudySteps(params.project_id).refresh()}><RefreshCcw /></Button
		>
		<AlertDialog.Root bind:open>
			<AlertDialog.Trigger class={buttonVariants({ size: 'icon-sm', variant: 'destructive' })}
				><Trash2 /></AlertDialog.Trigger
			>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
					<AlertDialog.Description>
						This action cannot be undone. This will permanently delete all of your study steps.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<AlertDialog.Action
						onclick={() => {
							toast.promise(deleteAllStudySteps(params.project_id), {
								loading: 'Deleting plan…',
								success: 'Deletion successful',
								error: 'An error occurred during deletion'
							});
							open = false;
						}}>Continue</AlertDialog.Action
					>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</div>
</div>
<div class="mt-2">
	<svelte:boundary>
		{#snippet pending()}
			<Loading thing="study plan" />
		{/snippet}
		{#if await getStudySteps(params.project_id)}
			<ul class="space-y-2 overflow-scroll">
				{#each await getStudySteps(params.project_id) as step (step.id)}
					<Item.Root variant="outline" class="flex-col items-start gap-2">
						<Item.Content>
							<Item.Title
								>{Intl.DateTimeFormat('en-gb', { dateStyle: 'medium' }).format(
									step.date
								)}</Item.Title
							>
							<Item.Description>{step.title}</Item.Description>
						</Item.Content>
						<Item.Actions>
							<Dialog.Root>
								<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}
									><Maximize2 />Details</Dialog.Trigger
								>
								<Dialog.Content>
									<Dialog.Header>
										<Dialog.Title>{step.title}</Dialog.Title>
										<Dialog.Description>
											{step.description}
										</Dialog.Description>
									</Dialog.Header>
								</Dialog.Content>
							</Dialog.Root>
						</Item.Actions>
					</Item.Root>
				{/each}
			</ul>
		{:else}
			<Muted
				>No study plan generated yet. Prompt the chat to generate one or refresh with the button
				above</Muted
			>
		{/if}
	</svelte:boundary>
</div>
