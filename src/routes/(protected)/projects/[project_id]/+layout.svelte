<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	import { deleteProject, getProject } from '$lib/remote/projects.remote';
	import { FlaskConical, Trash2 } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { resolve } from '$app/paths';

	let { params, children } = $props();
</script>

<main class="flex h-screen flex-col py-6">
	<!-- TODO -->
	<div class="mx-4 mb-2 flex items-center justify-between text-3xl">
		<svelte:boundary>
			{#snippet pending()}
				<Skeleton class="h-lh w-48 rounded-full" />
			{/snippet}
			<h1 class="text-3xl font-bold">
				{(await getProject(params.project_id)).name}
			</h1>
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
		</svelte:boundary>
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
</main>
