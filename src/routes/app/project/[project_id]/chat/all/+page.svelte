<script lang="ts">
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, MessageSquareX, Settings2 } from '@lucide/svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import {
		deleteProjectChatThread,
		getProjectChatThreads,
		renameProjectChatThread
	} from '$lib/remote/chat.remote';

	let { params } = $props();

	let renameDialogThreadId = $state<string | null>(null);

	let chats = $derived(await getProjectChatThreads({ projectId: params.project_id }));

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-GB', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(date);
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<ToolHeading>
				<Settings2 /> All Chats
			</ToolHeading>
		</div>
		<a
			href={resolve('/app/project/[project_id]/chat', params)}
			class={buttonVariants({ variant: 'outline' })}
		>
			<ArrowLeft />
			Back To Chat
		</a>
	</div>

	<div>
		<Item.Group>
			{#each chats as thread (thread.id)}
				{@const renameForm = renameProjectChatThread.for(thread.id)}
				{@const deleteForm = deleteProjectChatThread.for(thread.id)}
				<Item.Root variant="outline">
					<a
						href={`${resolve('/app/project/[project_id]/chat', {
							project_id: params.project_id
						})}?thread=${encodeURIComponent(thread.id)}`}
						class="group min-w-0 flex-1"
					>
						<Item.Content>
							<Item.Title class="group-hover:underline">{thread.title}</Item.Title>
							<Item.Description>
								Updated {formatDate(thread.updatedAt)}
							</Item.Description>
						</Item.Content>
					</a>
					<Item.Actions>
						<Dialog.Root
							bind:open={
								() => renameDialogThreadId === thread.id,
								(open) => {
									renameDialogThreadId = open ? thread.id : null;
								}
							}
						>
							<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>
								Rename
							</Dialog.Trigger>
							<Dialog.Content class="sm:max-w-md">
								<Dialog.Header>
									<Dialog.Title>Rename chat</Dialog.Title>
									<Dialog.Description>Choose a new title for this thread.</Dialog.Description>
								</Dialog.Header>
								<form
									class="flex flex-col gap-3"
									{...renameForm.enhance(async ({ submit, data }) => {
										const toastId = `rename-chat-${thread.id}`;
										toast.loading('Renaming chat...', { id: toastId });

										try {
											await submit();

											const issues = renameForm.fields.allIssues();
											if (issues?.length) {
												toast.error(issues[0].message, { id: toastId });
												return;
											}

											toast.success(`Renamed to ${data.title}`, { id: toastId });
										} catch {
											toast.error('Failed to rename chat', { id: toastId });
											return;
										}

										renameDialogThreadId = null;
									})}
								>
									<input type="hidden" name="projectId" value={params.project_id} />
									<Input
										{...renameForm.fields.title.as('text')}
										value={thread.title}
										placeholder="Chat title"
										aria-label="Chat title"
									/>
									{#if renameForm.fields.title.issues()}
										{#each renameForm.fields.title.issues() as issue, idx (idx)}
											<p class="text-sm text-destructive">{issue.message}</p>
										{/each}
									{/if}
									<Dialog.Footer>
										<Dialog.Close>
											{#snippet child({ props })}
												<Button {...props} type="button" variant="ghost">Cancel</Button>
											{/snippet}
										</Dialog.Close>
										<Button type="submit" disabled={renameForm.pending > 0}>
											{renameForm.pending > 0 ? 'Saving…' : 'Save'}
										</Button>
									</Dialog.Footer>
								</form>
							</Dialog.Content>
						</Dialog.Root>

						<form
							{...deleteForm.enhance(async ({ submit }) => {
								await toast.promise(submit(), {
									loading: 'Deleting chat...',
									success: 'Chat deleted',
									error: 'Failed to delete chat'
								});
							})}
						>
							<input type="hidden" name="projectId" value={params.project_id} />
							<Button
								size="sm"
								variant="destructive"
								type="submit"
								disabled={deleteForm.pending > 0}
							>
								{deleteForm.pending > 0 ? 'Deleting…' : 'Delete'}
							</Button>
						</form>
					</Item.Actions>
				</Item.Root>
			{:else}
				<Empty.Root class="border border-dashed">
					<Empty.Header>
						<Empty.Media variant="icon">
							<MessageSquareX />
						</Empty.Media>
						<Empty.Title>No chats</Empty.Title>
						<Empty.Description>You seem to not have created a chat yet.</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button href={resolve('/app/project/[project_id]/chat', params)}>Start chat</Button>
					</Empty.Content>
				</Empty.Root>
			{/each}
		</Item.Group>
	</div>
</div>
