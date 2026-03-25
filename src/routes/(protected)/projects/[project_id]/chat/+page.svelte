<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import {
		ArrowUpIcon,
		Brain,
		ChevronDown,
		Globe,
		GraduationCap,
		Paperclip,
		Plus,
		SlidersHorizontal,
		Trash2
	} from '@lucide/svelte';
	import { Chat } from '@ai-sdk/svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { DefaultChatTransport } from 'ai';
	import { resolve } from '$app/paths';
	import type { MyUIMessage } from '$lib/server/ai';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import { MessageCircle } from '@lucide/svelte';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { attachments, chatConfig } from '$lib/chat.svelte';
	import { getFiles } from '$lib/remote/files.remote';
	import { ScrollState, watch } from 'runed';
	import Message from '$lib/components/Message.svelte';
	import { fade } from 'svelte/transition';
	import { getChatLimit, getToolsLimit, subscribeToPro } from '$lib/remote/billing.remote';

	let { params } = $props();

	const chatLimitQuery = getChatLimit();
	const toolsLimitQuery = getToolsLimit();
	const toolsAllowed = $derived(toolsLimitQuery.current?.allowed ?? false);

	// Create a single persistent Chat instance with the consistent ID
	const chat = $derived(
		new Chat<MyUIMessage>({
			transport: new DefaultChatTransport({
				api: resolve('/(protected)/projects/[project_id]/api/chat', {
					project_id: params.project_id
				})
			}),
			onFinish: async () => {
				await getChatLimit().refresh();
			}
		})
	);

	let input = $state('');

	async function handleSubmit() {
		if (chat.status !== 'ready') return;
		if (!input.trim() && attachments.files.length === 0) return;

		chat.sendMessage(
			{
				// refactor to content:
				text: input,
				files: attachments.files.map((a) => ({
					mediaType: a.type,
					type: 'file',
					filename: a.name,
					url: a.utURL
				}))
			},
			{ body: { config: chatConfig.current, attachments } }
		);
		input = '';
		attachments.clear();
	}

	let chatContainer = $state<HTMLElement>();

	const scroll = new ScrollState({ element: () => chatContainer, behavior: 'smooth' });

	// Check if content overflows and user is not at bottom
	const atBottom = $derived(scroll.arrived.bottom);

	watch(
		() => chat.status,
		(s) => {
			if (s === 'ready') scroll.scrollToBottom();
		}
	);

	let hideMessageItem = $state(false);
	let loading = $state(false);
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4">
	<div class="flex justify-between">
		<ToolHeading>
			<MessageCircle /> Document Chat
		</ToolHeading>
		<Button
			href={resolve('/(protected)/projects/[project_id]/chat', params)}
			size="sm"
			variant="outline"><Plus /> New chat</Button
		>
	</div>
	<div class="flex min-h-0 flex-1 flex-col">
		<div class="relative no-scrollbar flex h-full min-h-0 flex-col">
			<ul
				bind:this={chatContainer}
				class="flex min-h-0 flex-1 flex-col gap-8 overflow-x-hidden overflow-y-auto pb-48"
			>
				{#each chat.messages as message, messageIndex (messageIndex)}
					<Message {message} />
				{/each}
				{#if chat.status === 'submitted'}
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
								{/if}</Item.Description
							>
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

			{@render chatInput()}
		</div>
	</div>
</div>

{#snippet chatInput()}
	<div class="mt-4 shrink-0 pb-2">
		<form
			onsubmit={async (e) => {
				e.preventDefault();
				if (chatLimitQuery.current && chatLimitQuery.current.allowed) handleSubmit();
			}}
			class="absolute bottom-0 w-full backdrop-blur-sm"
		>
			{#if !hideMessageItem && chatLimitQuery.current && !chatLimitQuery.current.balance?.unlimited}
				<div transition:fade={{ duration: 100 }} class="fixed w-full max-w-md -translate-y-full">
					<Item.Root variant="outline" size="xs" class="mb-2 bg-background">
						<Item.Content>
							<Item.Title>Message limits</Item.Title>
							<Item.Description>
								{@const { balance } = chatLimitQuery.current}
								{#if balance}
									{balance.remaining || 'No messages'} remaining. {#if balance.nextResetAt}
										Resets on {Intl.DateTimeFormat().format(balance.nextResetAt)}
									{/if}
								{/if}
							</Item.Description>
						</Item.Content>
						<Item.Actions>
							<Button size="sm" variant="secondary" onclick={() => (hideMessageItem = true)}
								>Dismiss</Button
							>
							<Button
								size="sm"
								onclick={async () => {
									loading = true;
									await subscribeToPro().then((url) => {
										if (url) window.location.href = url;
									});
								}}
								>{#if loading}<Spinner />{/if}Upgrade</Button
							>
						</Item.Actions>
					</Item.Root>
				</div>
			{/if}

			<InputGroup.Root class="rounded-xl">
				<InputGroup.Input
					bind:value={input}
					id="chat-input"
					name="message"
					placeholder="Ask, Search or Chat..."
				/>

				<InputGroup.Addon align="block-start" class="overflow-scroll">
					{#each attachments.files as att (att.id)}
						<ButtonGroup.Root class="w-48">
							<ButtonGroup.Text class="no-scrollbar min-w-0 truncate overflow-x-auto font-mono">
								{att.name}
							</ButtonGroup.Text>
							<InputGroup.Button
								variant="destructive"
								size="icon-xs"
								onclick={() => attachments.remove(att.id)}><Trash2 /></InputGroup.Button
							>
						</ButtonGroup.Root>
					{:else}
						<InputGroup.Text>No files in Chat</InputGroup.Text>
					{/each}
				</InputGroup.Addon>

				<InputGroup.Addon align="block-end">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class={buttonVariants({ size: 'sm', variant: 'outline' })}
							><SlidersHorizontal /> Tools</DropdownMenu.Trigger
						>
						<DropdownMenu.Content class="w-56" align="end">
							{#if toolsAllowed}
								<DropdownMenu.Label>Tool options</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.CheckboxItem bind:checked={chatConfig.current.studyModeEnabled}
									><GraduationCap /> Study mode</DropdownMenu.CheckboxItem
								>
								<DropdownMenu.CheckboxItem bind:checked={chatConfig.current.enhancedReasoning}
									><Brain /> Reasoning</DropdownMenu.CheckboxItem
								>
								<DropdownMenu.CheckboxItem bind:checked={chatConfig.current.webSearch}
									><Globe /> Web search</DropdownMenu.CheckboxItem
								>
							{:else}
								<DropdownMenu.Label>Tools</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									onclick={async () => {
										loading = true;
										await subscribeToPro().then((url) => {
											if (url) window.location.href = url;
										});
									}}><Globe /> Upgrade to Pro to use tools</DropdownMenu.Item
								>
								<DropdownMenu.Item disabled><GraduationCap /> Study mode</DropdownMenu.Item>
								<DropdownMenu.Item disabled><Brain /> Reasoning</DropdownMenu.Item>
								<DropdownMenu.Item disabled><Globe /> Web search</DropdownMenu.Item>
							{/if}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class={buttonVariants({ size: 'icon-sm', variant: 'outline' })}
							><Paperclip /></DropdownMenu.Trigger
						>
						<DropdownMenu.Content class="w-80">
							<DropdownMenu.Group>
								<DropdownMenu.Label>Select files to add to chat</DropdownMenu.Label>
								<DropdownMenu.Separator />
								{#each await getFiles(params.project_id) as file (file.id)}
									<DropdownMenu.CheckboxItem
										class="truncate"
										closeOnSelect={false}
										bind:checked={
											() => attachments.isInChat(file),
											(checked) => {
												if (checked) {
													attachments.add(file);
												} else {
													attachments.remove(file.id);
												}
											}
										}>{file.name}</DropdownMenu.CheckboxItem
									>
								{:else}
									<DropdownMenu.Item disabled>No files in knowledge base</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					{#if chatLimitQuery.current}
						<InputGroup.Button
							variant="default"
							class="ml-auto rounded-full"
							size="icon-xs"
							disabled={chat.status !== 'ready' || !chatLimitQuery.current.allowed}
						>
							{#if chat.status === 'ready'}
								<ArrowUpIcon />
								<span class="sr-only">Send</span>
							{:else}
								<Spinner />
							{/if}
						</InputGroup.Button>
					{/if}
				</InputGroup.Addon>
			</InputGroup.Root>
		</form>
	</div>
{/snippet}
