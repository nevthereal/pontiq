<script lang="ts">
	import { MessageCircle, ChevronDown } from '@lucide/svelte';
	import ChatInput from './ChatInput.svelte';
	import { Chat } from '@ai-sdk/svelte';
	import Message from './Message.svelte';
	import Spinner from './ui/spinner/spinner.svelte';
	import { ScrollState, watch } from 'runed';
	import Button from './ui/button/button.svelte';
	import { DefaultChatTransport } from 'ai';
	import { resolve } from '$app/paths';
	import type { MyUIMessage } from '$lib/server/ai';

	let { projectId }: { projectId: string } = $props();

	const chat = new Chat<MyUIMessage>({
		id: `${() => projectId}-chat`,
		transport: new DefaultChatTransport({
			api: resolve('/(protected)/projects/[project_id]/api/chat', { project_id: projectId })
		})
	});

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

<div class="flex h-full w-full flex-col rounded-2xl border p-6">
	<h1 class="flex min-h-0 items-center gap-2 border-b pb-2 text-2xl font-semibold">
		<MessageCircle /> Document Chat
	</h1>
	<div class="relative mt-4 no-scrollbar flex h-full min-h-0 flex-col">
		<ul bind:this={chatContainer} class="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pb-48">
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

		<div class="mt-2 flex-shrink-0">
			<ChatInput {projectId} {chat} />
		</div>
	</div>
</div>
