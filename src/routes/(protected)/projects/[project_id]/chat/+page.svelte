<script lang="ts">
	import {
		ArrowUpIcon,
		Brain,
		ChevronDown,
		Globe,
		GraduationCap,
		Plus,
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
	import { Toggle } from '$lib/components/ui/toggle';
	import { getFiles } from '$lib/remote/files.remote';
	import { ScrollState, watch } from 'runed';
	import Message from '$lib/components/Message.svelte';

	let { params } = $props();

	// Create a single persistent Chat instance with the consistent ID
	const chat = $derived(
		new Chat<MyUIMessage>({
			transport: new DefaultChatTransport({
				api: resolve('/(protected)/projects/[project_id]/api/chat', {
					project_id: params.project_id
				})
			})
		})
	);

	let input = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (chat.status !== 'ready') return;
		if (!input.trim() && attachments.files.length === 0) return;

		chat.sendMessage(
			{
				text: input,
				files: attachments.files.map((a) => ({
					mediaType: a.type,
					type: 'file',
					url: a.utURL,
					filename: a.name
				}))
			},
			{ body: { config: chatConfig.current } }
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
		<form onsubmit={handleSubmit} class="absolute bottom-0 w-full backdrop-blur-sm">
			<InputGroup.Root class="rounded-xl">
				<InputGroup.Input bind:value={input} placeholder="Ask, Search or Chat..." />

				<InputGroup.Addon align="block-start" class="overflow-scroll">
					{#each attachments.files as att (att.id)}
						<ButtonGroup.Root class="w-48">
							<ButtonGroup.Text
								class="no-scrollbar min-w-0 overflow-x-auto font-mono whitespace-nowrap"
							>
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
					<Toggle bind:pressed={chatConfig.current.studyModeEnabled} variant="outline" size="sm"
						><GraduationCap />Study mode</Toggle
					>
					<Toggle bind:pressed={chatConfig.current.enhancedReasoning} variant="outline" size="sm"
						><Brain />Reasoning</Toggle
					>
					<Toggle bind:pressed={chatConfig.current.webSearch} variant="outline" size="sm"
						><Globe />Web Search</Toggle
					>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class={buttonVariants({ size: 'icon-sm', variant: 'outline' })}
							><Plus /></DropdownMenu.Trigger
						>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Label>Select files to add to chat</DropdownMenu.Label>
								<DropdownMenu.Separator />
								{#each await getFiles(params.project_id) as file (file.id)}
									<DropdownMenu.CheckboxItem
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
					<InputGroup.Button
						variant="default"
						class="ml-auto rounded-full"
						size="icon-xs"
						disabled={!input || chat.status !== 'ready'}
					>
						{#if chat.status === 'ready'}
							<ArrowUpIcon />
							<span class="sr-only">Send</span>
						{:else}
							<Spinner />
						{/if}
					</InputGroup.Button>
				</InputGroup.Addon>
			</InputGroup.Root>
		</form>
	</div>
{/snippet}
