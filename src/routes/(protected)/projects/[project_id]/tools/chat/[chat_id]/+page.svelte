<script lang="ts">
	import { resolve } from '$app/paths';
	import Message from '$lib/components/Message.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { MyUIMessage } from '$lib/server/ai';
	import { Chat } from '@ai-sdk/svelte';
	import { ChevronDown } from '@lucide/svelte';
	import { DefaultChatTransport } from 'ai';
	import { ScrollState, watch } from 'runed';

	let { params } = $props();

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

	const chat = $derived(
		new Chat<MyUIMessage>({
			id: params.chat_id,
			transport: new DefaultChatTransport({
				api: resolve('/(protected)/projects/[project_id]/api/chat', {
					project_id: params.project_id
				})
			})
		})
	);
</script>

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
