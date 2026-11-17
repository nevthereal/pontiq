<script lang="ts">
	import {
		ArrowUpIcon,
		Brain,
		Globe,
		GraduationCap,
		Paperclip,
		SlidersHorizontal,
		X,
		FileText
	} from '@lucide/svelte';
	import * as InputGroup from '#lib/components/ui/input-group/index.ts';
	import * as Attachment from '#lib/components/ui/attachment/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';
	import * as Item from '#lib/components/ui/item/index.ts';
	import { buttonVariants } from '../ui/button';
	import { getFiles } from '#lib/remote/files.remote.ts';
	import { fade } from 'svelte/transition';
	import { getChatLimit, subscribeToPro } from '#lib/remote/billing.remote.ts';
	import type { Chat } from '@ai-sdk/svelte';
	import type { MyUIMessage } from '#lib/server/ai.ts';
	import { attachments, chatConfig } from '#lib/chat.svelte.ts';
	import { Spinner } from '../ui/spinner';
	import Button from '../ui/button/button.svelte';

	interface Props {
		chat: Chat<MyUIMessage>;
		projectId: string;
		threadId: string | null;
	}

	let { chat, projectId, threadId }: Props = $props();

	const chatLimitQuery = getChatLimit();

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
		if (chat.status !== 'ready' && chat.status !== 'error') return;
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
		class="relative w-full"
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
			<InputGroup.Textarea
				bind:value={input}
				id="chat-input"
				name="message"
				placeholder="Ask about your documents..."
				aria-label="Message"
				class="min-h-20 resize-none"
				onkeydown={(event) => {
					if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
						event.preventDefault();
						event.currentTarget.form?.requestSubmit();
					}
				}}
			/>

			{#if attachments.files.length > 0}
				<InputGroup.Addon align="block-start">
					<Attachment.Group class="flex-wrap">
						{#each attachments.files as att (att.id)}
							<Attachment.Root>
								<Attachment.Media><FileText /></Attachment.Media>
								<Attachment.Content
									><Attachment.Title>{att.name}</Attachment.Title></Attachment.Content
								>
								<Attachment.Actions
									><Attachment.Action
										aria-label={`Remove ${att.name}`}
										onclick={() => attachments.remove(att.id)}><X /></Attachment.Action
									></Attachment.Actions
								>
							</Attachment.Root>
						{/each}
					</Attachment.Group>
				</InputGroup.Addon>
			{/if}

			<InputGroup.Addon align="block-end">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={buttonVariants({ size: 'sm', variant: 'outline' })}
						><SlidersHorizontal /> Tools</DropdownMenu.Trigger
					>
					<DropdownMenu.Content class="w-56" align="end">
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
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={buttonVariants({ size: 'icon-sm', variant: 'outline' })}
						aria-label="Attach project files"><Paperclip /></DropdownMenu.Trigger
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
						type="submit"
						variant="default"
						class="ml-auto rounded-full"
						size="icon-sm"
						disabled={(chat.status !== 'ready' && chat.status !== 'error') ||
							!chatLimitQuery.current.allowed ||
							(!input.trim() && attachments.files.length === 0)}
					>
						{#if chat.status === 'ready' || chat.status === 'error'}
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
