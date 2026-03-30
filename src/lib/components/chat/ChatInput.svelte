<script lang="ts">
	import {
		ArrowUpIcon,
		Brain,
		Globe,
		GraduationCap,
		Paperclip,
		SlidersHorizontal,
		Trash2,
		Zap
	} from '@lucide/svelte';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Item from '$lib/components/ui/item';
	import { buttonVariants } from '../ui/button';
	import { getFiles } from '$lib/remote/files.remote';
	import { fade } from 'svelte/transition';
	import { getChatLimit, getCustomer, subscribeToPro } from '$lib/remote/billing.remote';
	import type { Chat } from '@ai-sdk/svelte';
	import type { MyUIMessage } from '$lib/server/ai';
	import { attachments, chatConfig } from '$lib/chat.svelte';
	import { Spinner } from '../ui/spinner';
	import Button from '../ui/button/button.svelte';

	interface Props {
		chat: Chat<MyUIMessage>;
		projectId: string;
		threadId: string | null;
	}

	let { chat, projectId, threadId }: Props = $props();

	const chatLimitQuery = getChatLimit();
	const customerQuery = getCustomer();
	const toolsAllowed = $derived(customerQuery.current?.isPro ?? false);

	let hideMessageItem = $state(false);
	let loading = $state(false);

	let input = $state('');

	async function handleUpgrade() {
		loading = true;
		try {
			const url = await subscribeToPro();
			if (url) window.location.href = url;
		} finally {
			loading = false;
		}
	}

	async function handleSubmit() {
		if (chat.status !== 'ready') return;
		if (!input.trim() && attachments.files.length === 0) return;

		chat.sendMessage(
			{
				text: input,
				files: attachments.files.map((a) => ({
					mediaType: a.type,
					type: 'file',
					filename: a.name,
					url: a.utURL
				}))
			},
			{ body: { config: chatConfig.current, threadId } }
		);
		input = '';
		attachments.clear();
	}
</script>

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
						<Button size="sm" onclick={handleUpgrade}
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
							<DropdownMenu.CheckboxItem
								closeOnSelect={false}
								bind:checked={chatConfig.current.studyModeEnabled}
								><GraduationCap /> Study mode</DropdownMenu.CheckboxItem
							>
							<DropdownMenu.CheckboxItem
								closeOnSelect={false}
								bind:checked={chatConfig.current.enhancedReasoning}
								><Brain /> Reasoning</DropdownMenu.CheckboxItem
							>
							<DropdownMenu.CheckboxItem
								closeOnSelect={false}
								bind:checked={chatConfig.current.webSearch}
								><Globe /> Web search</DropdownMenu.CheckboxItem
							>
						{:else}
							<DropdownMenu.Label>Tools</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item disabled>
								Upgrade to Pro to unlock Study mode, Reasoning, and Web search
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={handleUpgrade}
								><Zap /> Upgrade to Pro to use tools</DropdownMenu.Item
							>
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
							{#each await getFiles(projectId) as file (file.id)}
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
						size="icon-sm"
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
