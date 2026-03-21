<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	import { deleteSteps, getStudySteps } from '$lib/remote/tools.remote';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Maximize2, NotebookPen, RefreshCcw, Trash2 } from '@lucide/svelte';
	import Muted from '$lib/components/typography/Muted.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Loading from '$lib/components/typography/Loading.svelte';

	let { params } = $props();
</script>

<div class="flex justify-between">
	<ToolHeading>
		<NotebookPen /> Study Plan
	</ToolHeading>
	<div>
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
					<AlertDialog.Action onclick={async () => await deleteSteps(params.project_id)}
						>Continue</AlertDialog.Action
					>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</div>
</div>
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
							>{Intl.DateTimeFormat('en-gb', { dateStyle: 'medium' }).format(step.date)}</Item.Title
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
			>No study plan generated yet. Prompt the chat to generate one or refresh with the button above</Muted
		>
	{/if}
</svelte:boundary>
