<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Item from '$lib/components/ui/item/index.js';
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import { WorkflowChatTransport } from '@workflow/ai';
	import { Chat } from '@ai-sdk/svelte';
	import { ChevronDown, MessageCircle, Plus } from '@lucide/svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import type { MyUIMessage } from '$lib/server/ai';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import { attachments, chatConfig } from '$lib/chat.svelte';
	import { ScrollState, watch } from 'runed';
	import Message from '$lib/components/chat/Message.svelte';
	import { getChatLimit, getCustomer } from '$lib/remote/billing.remote';
	import { getProjectChatThread, getRecentProjectChats } from '$lib/remote/chat.remote';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';

	let { params } = $props();

	function getProjectId() {
		return params.project_id;
	}

	const chatLimitQuery = getChatLimit();
	const customerQuery = getCustomer();
	const recentChatsQuery = getRecentProjectChats({ projectId: getProjectId() });
	const initialThreadId = page.url.searchParams.get('thread');
	const initialThread = initialThreadId
		? await getProjectChatThread({ projectId: getProjectId(), threadId: initialThreadId })
		: null;

	type ProjectChatThread = NonNullable<typeof initialThread>;

	const toolsAllowed = $derived(customerQuery.current?.isPro ?? false);

	watch(
		() => toolsAllowed,
		(allowed) => {
			if (!allowed) {
				chatConfig.current.studyModeEnabled = false;
				chatConfig.current.enhancedReasoning = false;
				chatConfig.current.webSearch = false;
			}
		}
	);

	let selectedThreadId = $state<string | null>(initialThread?.id ?? null);
	let selectedThread = $state.raw<ProjectChatThread | null>(initialThread);
	let resumableRunId = $state<string | null>(initialThread?.activeRunId ?? null);
	let activeResponseThreadId = $state<string | null>(
		initialThread?.activeRunId ? initialThread.id : null
	);
	let loadingThread = $state(false);
	let chatContainer = $state<HTMLElement>();
	let currentChatVersion = 0;
	let currentThreadSelectionVersion = 0;

	const currentTitle = $derived(selectedThread?.title ?? 'New chat');
	const recentChats = $derived(recentChatsQuery.current ?? []);

	function hasRenderableAssistantContent(message: MyUIMessage) {
		return message.parts.some((part) => {
			if (part.type === 'text' || part.type === 'reasoning') {
				return part.text.trim().length > 0;
			}

			return true;
		});
	}

	async function reconcileFinishedThread(
		threadId: string,
		version: number,
		messages: MyUIMessage[]
	) {
		for (const delayMs of [0, 250, 1000]) {
			if (delayMs > 0) {
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}

			if (version !== currentChatVersion || selectedThreadId !== threadId) {
				return;
			}

			await recentChatsQuery.refresh();

			if (version !== currentChatVersion || selectedThreadId !== threadId) {
				return;
			}

			const recentThread = recentChatsQuery.current?.find((thread) => thread.id === threadId);
			if (!recentThread || selectedThread?.id !== threadId) {
				continue;
			}

			selectedThread = {
				...selectedThread,
				title: recentThread.title,
				updatedAt: recentThread.updatedAt,
				createdAt: recentThread.createdAt,
				activeRunId: null,
				messages
			};

			if (recentThread.title !== 'New chat' || delayMs === 1000) {
				return;
			}
		}
	}

	function createChatInstance(thread: ProjectChatThread | null, threadId: string | null) {
		const version = ++currentChatVersion;
		const chatId = threadId ?? `draft-${version}`;

		return new Chat<MyUIMessage>({
			id: chatId,
			messages: (thread?.messages ?? []) as MyUIMessage[],
			transport: new WorkflowChatTransport<MyUIMessage>({
				api: resolve('/(protected)/projects/[project_id]/api/chat', {
					project_id: getProjectId()
				}),
				prepareReconnectToStreamRequest: async (request) => {
					if (!resumableRunId) {
						throw new Error('No resumable workflow run available');
					}

					return {
						...request,
						api: resolve('/(protected)/projects/[project_id]/api/chat/[run_id]/stream', {
							project_id: getProjectId(),
							run_id: resumableRunId
						})
					};
				},
				onChatSendMessage: async (response, options) => {
					if (version !== currentChatVersion) return;

					const threadIdFromResponse = response.headers.get('x-chat-thread-id');
					const runId = response.headers.get('x-workflow-run-id');

					if (threadIdFromResponse) {
						selectedThreadId = threadIdFromResponse;
						selectedThread = {
							id: threadIdFromResponse,
							title: selectedThread?.title ?? 'New chat',
							activeRunId: runId,
							updatedAt: new Date(),
							createdAt: selectedThread?.createdAt ?? new Date(),
							messages: options.messages
						} as ProjectChatThread;
						syncThreadUrl(threadIdFromResponse);
					}

					if (runId) {
						resumableRunId = runId;
						activeResponseThreadId = threadIdFromResponse ?? selectedThreadId;
					}

					await recentChatsQuery.refresh();
				},
				onChatEnd: async () => {
					if (version !== currentChatVersion) return;

					const finishedThreadId = activeResponseThreadId;
					const finishedMessages = $state.snapshot(chat.messages) as MyUIMessage[];
					activeResponseThreadId = null;
					resumableRunId = null;

					if (selectedThread && finishedThreadId && selectedThread.id === finishedThreadId) {
						selectedThread = {
							...selectedThread,
							activeRunId: null,
							messages: finishedMessages
						};
					}

					if (finishedThreadId && selectedThreadId === finishedThreadId) {
						await reconcileFinishedThread(finishedThreadId, version, finishedMessages);
					} else {
						await recentChatsQuery.refresh();
					}
				}
			}),
			onFinish: async ({ isAbort }) => {
				if (version !== currentChatVersion) return;

				if (!isAbort) {
					await chatLimitQuery.refresh();
				}
			}
		});
	}

	let chat = $state(createChatInstance(initialThread, initialThread?.id ?? null));
	const lastChatMessage = $derived(chat.messages.at(-1));
	const isWaitingForAssistantContent = $derived(
		chat.status !== 'ready' &&
			lastChatMessage?.role === 'assistant' &&
			!hasRenderableAssistantContent(lastChatMessage)
	);

	const scroll = new ScrollState({ element: () => chatContainer, behavior: 'smooth' });
	const atBottom = $derived(scroll.arrived.bottom);

	async function scrollToLatestMessages() {
		await tick();
		scroll.scrollToBottom();
	}

	watch(
		() => chat.status,
		(status) => {
			if (status === 'ready') scroll.scrollToBottom();
		}
	);

	watch(
		() => loadingThread,
		(isLoading) => {
			if (!isLoading) {
				void scrollToLatestMessages();
			}
		}
	);

	function syncThreadUrl(threadId: string | null) {
		const basePath = resolve('/(protected)/projects/[project_id]/chat', {
			project_id: getProjectId()
		});
		const nextPath = threadId ? `${basePath}?thread=${encodeURIComponent(threadId)}` : basePath;

		replaceState(nextPath, page.state);
	}

	function formatUpdatedAt(date: Date) {
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function replaceChat(thread: ProjectChatThread | null, threadId: string | null) {
		chat = createChatInstance(thread, threadId);
	}

	async function refreshThread(
		threadId: string,
		options?: { recreateChat?: boolean; selectionVersion?: number }
	) {
		const thread = await getProjectChatThread({ projectId: getProjectId(), threadId });
		if (
			options?.selectionVersion != null &&
			options.selectionVersion !== currentThreadSelectionVersion
		) {
			return null;
		}

		selectedThread = thread;
		resumableRunId = thread.activeRunId;

		if (options?.recreateChat ?? true) {
			replaceChat(thread, thread.id);
		} else {
			chat.messages = thread.messages as MyUIMessage[];
		}

		return thread;
	}

	async function openDraftChat() {
		currentThreadSelectionVersion += 1;

		attachments.clear();
		selectedThreadId = null;
		selectedThread = null;
		resumableRunId = null;
		activeResponseThreadId = null;
		replaceChat(null, null);
		syncThreadUrl(null);
		void scrollToLatestMessages();
	}

	async function selectThread(threadId: string) {
		if (threadId === selectedThreadId) return;
		const selectionVersion = ++currentThreadSelectionVersion;

		loadingThread = true;
		attachments.clear();

		try {
			selectedThreadId = threadId;
			syncThreadUrl(threadId);
			const thread = await refreshThread(threadId, { selectionVersion });
			if (!thread) return;

			if (browser && thread.activeRunId) {
				activeResponseThreadId = thread.id;
				void chat.resumeStream();
			}
		} finally {
			if (selectionVersion === currentThreadSelectionVersion) {
				loadingThread = false;
			}

			await recentChatsQuery.refresh();
		}
	}

	if (browser && initialThread?.activeRunId) {
		activeResponseThreadId = initialThread.id;
		queueMicrotask(() => {
			void chat.resumeStream();
		});
	}
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4">
	<div class="flex justify-between">
		<ToolHeading>
			<MessageCircle /> Document Chat
		</ToolHeading>
		<div class="flex items-center gap-1">
			<Button onclick={openDraftChat} size="icon"><Plus /></Button>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
					<span class="truncate">{currentTitle}</span>
					<ChevronDown />
				</DropdownMenu.Trigger>

				<DropdownMenu.Content align="end" class="w-80">
					<DropdownMenu.Label>Recent chats</DropdownMenu.Label>
					<DropdownMenu.Separator />

					{#if recentChats.length > 0}
						{#each recentChats as thread (thread.id)}
							<DropdownMenu.Item onclick={() => selectThread(thread.id)}>
								<div class="flex min-w-0 flex-1 flex-col">
									<span class="truncate">{thread.title}</span>
									<span class="text-xs text-muted-foreground">
										{formatUpdatedAt(thread.updatedAt)}
									</span>
								</div>
							</DropdownMenu.Item>
						{/each}
					{:else}
						<DropdownMenu.Item disabled>No previous chats yet</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<div class="flex min-h-0 flex-1 flex-col">
		<div class="relative no-scrollbar flex h-full min-h-0 flex-col">
			<ul
				bind:this={chatContainer}
				class="flex min-h-0 flex-1 flex-col gap-8 overflow-x-hidden overflow-y-auto pb-48"
			>
				{#if loadingThread}
					<p class="flex items-center gap-2 font-medium text-muted-foreground">
						<Spinner /> Loading chat
					</p>
				{:else}
					{#each chat.messages as message, messageIndex (message.id ?? messageIndex)}
						{#if !(
							isWaitingForAssistantContent &&
							messageIndex === chat.messages.length - 1 &&
							message.role === 'assistant'
						)}
							<Message {message} />
						{/if}
					{/each}
				{/if}

				{#if chat.status === 'submitted' || isWaitingForAssistantContent}
					<p class="flex items-center gap-2 font-medium text-muted-foreground">
						<Spinner /> Loading message
					</p>
				{:else if chat.status === 'error'}
					<Item.Root variant="outline" class="bg-destructive/10">
						<Item.Content>
							<Item.Title>An unexpected error occured.</Item.Title>
							<Item.Description>
								{#if chat.error}
									{chat.error.name}: {chat.error.message}
								{:else}
									Try again later
								{/if}
							</Item.Description>
						</Item.Content>
					</Item.Root>
				{/if}
			</ul>

			{#if !atBottom}
				<Button
					size="icon-sm"
					class="absolute right-0 bottom-40"
					variant="outline"
					onclick={() => scroll.scrollToBottom()}
					aria-label="Scroll to bottom"
				>
					<ChevronDown class="h-5 w-5" />
				</Button>
			{/if}

			<ChatInput projectId={getProjectId()} threadId={selectedThreadId} {chat} />
		</div>
	</div>
</div>
