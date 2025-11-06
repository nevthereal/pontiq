<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { MyUIMessage } from '$lib/server/ai';
	import * as Item from '$lib/components/ui/item/index.js';
	import { FileText, Globe, WalletCards, NotebookPen, Brain } from '@lucide/svelte';
	import { marked } from 'marked';
	import { fade } from 'svelte/transition';
	import ToolWrapper from './ToolWrapper.svelte';

	let { message }: { message: MyUIMessage } = $props();
</script>

<li in:fade|global>
	{#if message.role === 'user'}
		<Item.Root class="ml-auto w-fit max-w-lg" variant="muted">
			<Item.Content>
				<!-- Files container - flex row -->
				{#if message.parts.some((part) => part.type === 'file')}
					<div class="mb-2 flex flex-wrap gap-1">
						{#each message.parts as part, partIndex (partIndex)}
							{#if part.type === 'file'}
								<Item.Root variant="outline" size="sm">
									<Item.Media>
										<FileText class="h-lh" />
									</Item.Media>
									<Item.Content>
										<Item.Title>{part.filename}</Item.Title>
									</Item.Content>
								</Item.Root>
							{/if}
						{/each}
					</div>
				{/if}

				<!-- Text content below files -->
				{#each message.parts as part, partIndex (partIndex)}
					{#if part.type === 'text'}
						<Item.Title class="prose dark:prose-invert">
							<!-- eslint-disable svelte/no-at-html-tags -->
							{@html marked(part.text)}
						</Item.Title>
					{/if}
				{/each}
			</Item.Content>
		</Item.Root>
	{:else if message.role === 'assistant'}
		<div in:fade|global class="flex flex-col">
			<!-- Text content -->
			{#each message.parts as part, idx (idx)}
				{#if part.type === 'text'}
					<div class="prose max-w-full dark:prose-invert">
						<!-- eslint-disable svelte/no-at-html-tags -->
						{@html marked(part.text)}
					</div>
				{:else if part.type === 'reasoning'}
					<Tooltip.Provider delayDuration={250}>
						<Tooltip.Root>
							<Tooltip.Trigger class="mr-auto"
								><ToolWrapper
									className={part.state === 'streaming' ? 'animate-pulse' : ''}
									icon={Brain}>Reasoning</ToolWrapper
								></Tooltip.Trigger
							>
							<Tooltip.Content sideOffset={-10} class="max-w-md">
								{#if part.text}
									{@html marked(part.text)}
								{:else}
									<p>No reasoning summary</p>
								{/if}
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				{:else if part.type === 'tool-web_search'}
					<ToolWrapper
						className={part.state === 'input-streaming' ? 'animate-pulse' : ''}
						icon={Globe}>Searched for {part.input?.query}</ToolWrapper
					>
				{:else if part.type === 'tool-flashcards'}
					<ToolWrapper
						className={part.state === 'input-streaming' ? 'animate-pulse' : ''}
						icon={WalletCards}>Created flashcard {part.input?.term}</ToolWrapper
					>
				{:else if part.type === 'tool-study_plan'}
					<ToolWrapper
						className={part.state === 'input-streaming' ? 'animate-pulse' : ''}
						icon={NotebookPen}>Added {part.input?.type} "{part.input?.title}"</ToolWrapper
					>
				{/if}
			{/each}
		</div>
	{/if}
</li>
