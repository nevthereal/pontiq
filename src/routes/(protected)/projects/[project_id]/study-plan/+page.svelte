<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import { getStudySteps } from '$lib/remote/tools.remote';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Maximize2, NotebookPen, Settings2 } from '@lucide/svelte';
	import Muted from '$lib/components/typography/Muted.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Loading from '$lib/components/typography/Loading.svelte';

	let { params } = $props();
</script>

<div class="flex min-h-0 flex-1 flex-col">
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
		</div>
	</div>

	<div class="mt-2 min-h-0 flex-1">
		<svelte:boundary>
			{#snippet pending()}
				<Loading thing="study plan" />
			{/snippet}
			{#if await getStudySteps(params.project_id)}
				<div class="h-full min-h-0 overflow-y-auto">
					<ul class="space-y-2 pr-1">
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
				</div>
			{:else}
				<Muted
					>No study plan generated yet. Prompt the chat to generate one or refresh with the button
					above</Muted
				>
			{/if}
		</svelte:boundary>
	</div>
</div>
