<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import { deleteSteps, getStudySteps } from '$lib/remote/tools.remote';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Maximize2, NotebookPen, RefreshCcw } from '@lucide/svelte';
	import Muted from '$lib/components/typography/Muted.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Loading from '$lib/components/typography/Loading.svelte';

	let { params } = $props();
</script>

<div class="flex justify-between">
	<ToolHeading>
		<NotebookPen /> Study Plan
	</ToolHeading>
	<Button
		variant="ghost"
		size="icon-sm"
		title="Refresh steps"
		onclick={async () => await getStudySteps(params.project_id).refresh()}><RefreshCcw /></Button
	>
</div>
<svelte:boundary>
	{#snippet pending()}
		<Loading thing="study plan" />
	{/snippet}
	{#if await getStudySteps(params.project_id)}
		<Button onclick={async () => await deleteSteps(params.project_id)}>Delete</Button>
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
