<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Item from '$lib/components/ui/item/index.js';

	import { deleteProject, getProject, getSubjectsWithProjects } from '$lib/remote/projects.remote';
	import {
		ChevronsUpDown,
		Trash2,
		CreditCard,
		MessageCircle,
		NotebookPen,
		Workflow
	} from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { resolve } from '$app/paths';
	import { createAIContext } from '@ai-sdk/svelte';

	let { params, children } = $props();

	const projectPromise = $derived(getProject(params.project_id));

	const project = $derived(await projectPromise);

	createAIContext();
</script>

<section class="flex h-screen flex-col py-4">
	<!-- TODO -->
	<div class="mx-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Sidebar.Trigger />
			<h1 class="font-bold">
				{project.name}
			</h1>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={buttonVariants({ size: 'icon-sm', variant: 'ghost' })}
					><ChevronsUpDown /></DropdownMenu.Trigger
				>
				<DropdownMenu.Content align="start">
					<DropdownMenu.Group>
						<DropdownMenu.Label>Switch project</DropdownMenu.Label>
						<DropdownMenu.Separator />
						{#each await getSubjectsWithProjects() as sub (sub.id)}
							<DropdownMenu.Label>{sub.title}</DropdownMenu.Label>
							{#each sub.projects as project (project.id)}
								<a href={resolve('/(protected)/projects/[project_id]', { project_id: project.id })}
									><DropdownMenu.Item>{project.name}</DropdownMenu.Item></a
								>
							{/each}
						{/each}
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		{@render deleteButton()}
	</div>

	<div class="m-3 flex min-h-0 flex-1 gap-4">
		<!-- Sidebar!! -->
		<div class="flex min-h-0 min-w-sm flex-col rounded-2xl border p-6">
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
		<div class="flex min-h-0 w-full flex-col">
			{@render children()}
		</div>
	</div>
</section>

{#snippet deleteButton()}
	<div class="flex items-center gap-2">
		<AlertDialog.Root>
			<AlertDialog.Trigger class={buttonVariants({ size: 'sm', variant: 'destructive' })}
				><Trash2 /> Delete</AlertDialog.Trigger
			>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
					<AlertDialog.Description>
						This action cannot be undone. This will permanently delete this project, all of its
						files, threads and tool results.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<AlertDialog.Action
						onclick={() =>
							toast.promise(
								deleteProject(params.project_id).then(() => goto(resolve('/'))),
								{
									loading: 'Deleting project…',
									success: 'Deletion successful',
									error: 'An error occurred during deletion'
								}
							)}
						class={buttonVariants({ variant: 'destructive' })}>Continue</AlertDialog.Action
					>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</div>
{/snippet}
