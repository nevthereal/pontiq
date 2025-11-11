<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import { deleteProject, getProject, getSubjectsWithProjects } from '$lib/remote/projects.remote';
	import { ChevronsUpDown, FlaskConical, Trash2 } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { resolve } from '$app/paths';

	let { params, children } = $props();

	const projectPromise = $derived(getProject(params.project_id));

	const project = $derived(await projectPromise);
</script>

<section class="flex h-screen flex-col py-4">
	<!-- TODO -->
	<div class="mx-4 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Sidebar.Trigger />
			<h1 class="text-4xl font-bold">
				{project.name}
			</h1>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={buttonVariants({ size: 'icon-sm', variant: 'ghost' })}
					><ChevronsUpDown /></DropdownMenu.Trigger
				>
				<DropdownMenu.Content sideOffset={16} align="end">
					<DropdownMenu.Group>
						<DropdownMenu.Label>Select project</DropdownMenu.Label>
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
		<div class="flex items-center gap-2">
			<AlertDialog.Root>
				<AlertDialog.Trigger class={buttonVariants({ size: 'sm', variant: 'destructive' })}
					><Trash2 /> Delete</AlertDialog.Trigger
				>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action cannot be undone. This will permanently delete this project, all of it's
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
										success: 'Deletion sucessful',
										error: 'An error occured during deletion'
									}
								)}
							class={buttonVariants({ variant: 'destructive' })}>Continue</AlertDialog.Action
						>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</div>

	<div class="m-4 flex h-full gap-4 overflow-scroll">
		<div class="flex h-full w-lg max-w-2xl flex-col rounded-2xl border p-6">
			<h1 class="flex items-center gap-2 border-b pb-2 text-2xl font-semibold">
				<FlaskConical /> Tools
			</h1>
			{@render children()}
		</div>
		<ChatContainer projectId={params.project_id} />
	</div>
</section>
