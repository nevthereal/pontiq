<script lang="ts">
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, Settings2 } from '@lucide/svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import Muted from '$lib/components/typography/Muted.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import {
		deleteProjectChatThread,
		getProjectChatThreads,
		renameProjectChatThread
	} from '$lib/remote/chat.remote';

	let { params } = $props();

	function getProjectId() {
		return params.project_id;
	}

	const chatsQuery = getProjectChatThreads({ projectId: getProjectId() });
	const initialChats = (await chatsQuery) ?? [];

	type ProjectChatSummary = (typeof initialChats)[number];

	let chats = $derived(sortChats(chatsQuery.current ?? initialChats));
	let renameDialogOpen = $state(false);
	let renameThreadId = $state<string | null>(null);
	let renameValue = $state('');
	const trimmedRenameValue = $derived(renameValue.trim());
	let savingRename = $state(false);
	let deletingThreadId = $state<string | null>(null);

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-GB', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(date);
	}

	function sortChats(nextChats: ProjectChatSummary[]) {
		return [...nextChats].sort((left, right) => {
			const updatedDifference = right.updatedAt.getTime() - left.updatedAt.getTime();
			if (updatedDifference !== 0) return updatedDifference;

			return right.createdAt.getTime() - left.createdAt.getTime();
		});
	}

	async function refreshChats() {
		await chatsQuery.refresh();
	}

	function openRenameDialog(thread: ProjectChatSummary) {
		renameThreadId = thread.id;
		renameValue = thread.title;
		renameDialogOpen = true;
	}

	async function handleRename(event: SubmitEvent) {
		event.preventDefault();

		if (!renameThreadId || !trimmedRenameValue.length) return;

		savingRename = true;

		try {
			const updatedThread = await renameProjectChatThread({
				projectId: getProjectId(),
				threadId: renameThreadId,
				title: trimmedRenameValue
			});

			chats = sortChats(
				chats.map((thread) => (thread.id === updatedThread.id ? updatedThread : thread))
			);
			renameDialogOpen = false;
			renameThreadId = null;
			renameValue = '';
			toast.success('Chat renamed');
		} catch (error) {
			console.error(error);
			toast.error('Failed to rename chat');
		} finally {
			savingRename = false;
		}
	}

	async function handleDelete(threadId: string) {
		deletingThreadId = threadId;

		try {
			await deleteProjectChatThread({
				projectId: getProjectId(),
				threadId
			});

			await refreshChats();

			if (renameThreadId === threadId) {
				renameDialogOpen = false;
				renameThreadId = null;
				renameValue = '';
			}

			toast.success('Chat deleted');
		} catch (error) {
			console.error(error);
			toast.error('Failed to delete chat');
		} finally {
			deletingThreadId = null;
		}
	}
</script>

<Dialog.Root bind:open={renameDialogOpen}>
	<div class="space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<ToolHeading>
					<Settings2 /> All Chats
				</ToolHeading>
				<Muted class="mt-1">Open, rename or delete a saved chat thread.</Muted>
			</div>
			<a
				href={resolve('/app/project/[project_id]/chat', {
					project_id: getProjectId()
				})}
				class={buttonVariants({ variant: 'outline' })}
			>
				<ArrowLeft />
				Back To Chat
			</a>
		</div>

		<section class="rounded-xl border bg-card">
			<div class="border-b p-4">
				<h2 class="font-semibold">Threads</h2>
				<p class="text-sm text-muted-foreground">{chats.length} total</p>
			</div>

			<div class="p-3">
				{#if chats.length}
					<Item.Group class="space-y-2">
						{#each chats as thread (thread.id)}
							<Item.Root variant="outline">
								<a
									href={`${resolve('/app/project/[project_id]/chat', {
										project_id: getProjectId()
									})}?thread=${encodeURIComponent(thread.id)}`}
									class="min-w-0 flex-1"
								>
									<Item.Content>
										<Item.Title>{thread.title}</Item.Title>
										<Item.Description>
											Updated {formatDate(thread.updatedAt)}
										</Item.Description>
									</Item.Content>
								</a>
								<Item.Actions>
									<Button size="sm" variant="outline" onclick={() => openRenameDialog(thread)}>
										Rename
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled={deletingThreadId === thread.id}
										onclick={() => void handleDelete(thread.id)}
									>
										Delete
									</Button>
								</Item.Actions>
							</Item.Root>
						{/each}
					</Item.Group>
				{:else}
					<div class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
						No saved chats yet.
					</div>
				{/if}
			</div>
		</section>
	</div>

	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Rename chat</Dialog.Title>
			<Dialog.Description>Choose a new title for this thread.</Dialog.Description>
		</Dialog.Header>

		<form class="flex flex-col gap-3" onsubmit={handleRename}>
			<Input
				type="text"
				bind:value={renameValue}
				placeholder="Chat title"
				maxlength={120}
				aria-label="Chat title"
			/>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="ghost">Cancel</Button>
					{/snippet}
				</Dialog.Close>
				<Button type="submit" disabled={!trimmedRenameValue.length || savingRename}>
					{savingRename ? 'Saving…' : 'Save'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
