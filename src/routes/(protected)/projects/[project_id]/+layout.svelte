<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';

	import { getProject } from '$lib/remote/projects.remote';
	import { CreditCard, MessageCircle, NotebookPen, Workflow } from '@lucide/svelte';

	import { resolve } from '$app/paths';

	let { params, children } = $props();

	const project = $derived(await getProject(params.project_id));
</script>

<section class="flex h-full w-full flex-col">
	<div class="flex min-h-0 flex-1 gap-4">
		<!-- Sidebar!! -->
		<div class="flex min-w-sm flex-col rounded-2xl border p-6">
			<a
				href={resolve('/(protected)/projects/[project_id]', { project_id: params.project_id })}
				class="flex items-center gap-2 border-b pb-2 text-2xl font-semibold"
				>Project: {project.name}</a
			>
			<Item.Group class="mt-4 space-y-2">
				<Item.Root variant="outline">
					{#snippet child({ props })}
						<a href={resolve('/(protected)/projects/[project_id]/chat', params)} {...props}>
							<Item.Media class="max-lg:hidden" variant="icon">
								<MessageCircle />
							</Item.Media>
							<Item.Content>Chat</Item.Content>
						</a>
					{/snippet}
				</Item.Root>
				<Item.Root variant="outline">
					{#snippet child({ props })}
						<a href={resolve('/(protected)/projects/[project_id]/files', params)} {...props}>
							<Item.Media class="max-lg:hidden" variant="icon">
								<Workflow />
							</Item.Media>
							<Item.Content>Knowledge Base</Item.Content>
						</a>
					{/snippet}
				</Item.Root>
				<Item.Root variant="outline">
					{#snippet child({ props })}
						<a href={resolve('/(protected)/projects/[project_id]/study-plan', params)} {...props}>
							<Item.Media class="max-lg:hidden" variant="icon">
								<NotebookPen />
							</Item.Media>
							<Item.Content>Study Plan</Item.Content>
						</a>
					{/snippet}
				</Item.Root>
				<Item.Root variant="outline">
					{#snippet child({ props })}
						<a href={resolve('/(protected)/projects/[project_id]/flashcards', params)} {...props}>
							<Item.Media class="max-lg:hidden" variant="icon">
								<CreditCard />
							</Item.Media>
							<Item.Content>Flashcards (work in progress)</Item.Content>
						</a>
					{/snippet}
				</Item.Root>
			</Item.Group>
		</div>
		<div class="flex min-h-0 w-full flex-col overflow-hidden">
			{@render children()}
		</div>
	</div>
</section>
