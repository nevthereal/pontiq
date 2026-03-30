<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import { ChevronDown, Plus } from '@lucide/svelte';
	import { Chat } from '@ai-sdk/svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { DefaultChatTransport } from 'ai';
	import { resolve } from '$app/paths';
	import type { MyUIMessage } from '$lib/server/ai';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import { MessageCircle } from '@lucide/svelte';
	import { chatConfig } from '$lib/chat.svelte';
	import { ScrollState, watch } from 'runed';
	import Message from '$lib/components/chat/Message.svelte';
	import { getChatLimit, getCustomer } from '$lib/remote/billing.remote';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';

	let { params } = $props();
	const projectId = $derived(params.project_id);

	const chatLimitQuery = getChatLimit();
	const customerQuery = getCustomer();
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

	const chat = $derived(
		new Chat<MyUIMessage>({
			transport: new DefaultChatTransport({
				api: resolve('/(protected)/projects/[project_id]/api/chat', {
					project_id: projectId
				})
			}),
			onFinish: async () => {
				await chatLimitQuery.refresh();
			}
		})
	);

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

			<ChatInput {projectId} {chat} />
		</div>
	</div>
</div>
