<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Trash2 } from '@lucide/svelte';
	import { deleteProject, getProject } from '$lib/remote/projects.remote';
	import { resolve } from '$app/paths';

	let { params } = $props();

	const project = $derived(await getProject(params.project_id));
</script>

<h1>{project.name}</h1>
<div class="flex items-center gap-2">
	<AlertDialog.Root>
		<AlertDialog.Trigger class={buttonVariants({ size: 'sm', variant: 'destructive' })}
			><Trash2 /> Delete</AlertDialog.Trigger
		>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
				<AlertDialog.Description>
					This action cannot be undone. This will permanently delete this project, all of its files,
					threads and tool results.
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
