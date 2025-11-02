<script lang="ts">
	import type { MyUIMessage } from '$lib/server/ai';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Brain, FileText, Globe, ToolCase, WalletCards } from '@lucide/svelte';
	import { marked } from 'marked';
	import { fade } from 'svelte/transition';
	import ToolWrapper from './ToolWrapper.svelte';

	let { message }: { message: MyUIMessage } = $props();

	function getToolLabel(type: string): string {
		switch (type) {
			case 'tool-study_plan':
				return 'Study Plans';
			case 'tool-web_search':
				return 'Web Searches';
			case 'tool-flashcards':
				return 'Flashcards';
			default:
				return 'Tools';
		}
	}

	function getToolIcon(type: string) {
		switch (type) {
			case 'tool-study_plan':
				return ToolCase;
			case 'tool-web_search':
				return Globe;
			case 'tool-flashcards':
				return WalletCards;
			default:
				return ToolCase;
		}
	}

	// Parse message parts into sections, separating text from tools/reasoning
	function parseMessageSections(parts: typeof message.parts) {
		const sections: Array<{
			type: 'text';
			data: typeof message.parts;
		}> = [];

		for (const part of parts) {
			if (part.type === 'text') {
				sections.push({ type: 'text', data: [part] });
			}
		}

		return sections;
	}

	// Extract all completed reasoning parts
	function getCompletedReasoningParts(parts: typeof message.parts) {
		return parts.filter((part) => part.type === 'reasoning' && part.state === 'done');
	}

	// Extract streaming reasoning (first one found)
	function getStreamingReasoning(parts: typeof message.parts) {
		return parts.find((part) => part.type === 'reasoning' && part.state === 'streaming');
	}

	// Extract all tool parts
	function getToolParts(parts: typeof message.parts) {
		return parts.filter((part) => part.type.startsWith('tool-'));
	}

	// Group tool calls within a section by type
	function groupToolsByType(toolParts: typeof message.parts) {
		const groups: { [key: string]: typeof message.parts } = {
			'tool-study_plan': [],
			'tool-web_search': [],
			'tool-flashcards': []
		};

		toolParts.forEach((part) => {
			if (part.type === 'tool-study_plan') {
				groups['tool-study_plan'].push(part);
			} else if (part.type === 'tool-web_search') {
				groups['tool-web_search'].push(part);
			} else if (part.type === 'tool-flashcards') {
				groups['tool-flashcards'].push(part);
			}
		});

		return groups;
	}

	const messageSections = $derived(
		message.role === 'assistant' ? parseMessageSections(message.parts) : []
	);

	const streamingReasoning = $derived(
		message.role === 'assistant' ? getStreamingReasoning(message.parts) : null
	);

	const completedReasoningParts = $derived(
		message.role === 'assistant' ? getCompletedReasoningParts(message.parts) : []
	);

	const toolParts = $derived(message.role === 'assistant' ? getToolParts(message.parts) : []);

	const toolGroups = $derived(groupToolsByType(toolParts));

	const hasReasoningOrTools = $derived(
		completedReasoningParts.length > 0 ||
			Object.values(toolGroups).some((group) => group.length > 0)
	);
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
		<div in:fade|global>
			<!-- Text content -->
			{#each messageSections as section, sectionIndex (sectionIndex)}
				{#if section.type === 'text'}
					{#each section.data as part, partIndex (partIndex)}
						{#if part.type === 'text'}
							<div class="prose max-w-full dark:prose-invert">
								<!-- eslint-disable svelte/no-at-html-tags -->
								{@html marked(part.text)}
							</div>
						{/if}
					{/each}
				{/if}
			{/each}

			<!-- Streaming reasoning (if present) -->
			{#if streamingReasoning}
				<p class="mb-2 flex animate-pulse items-center gap-2 text-muted-foreground select-none">
					<Brain size={16} /> Thinking...
				</p>
			{/if}

			<!-- Unified accordion for reasoning and tools -->
			{#if hasReasoningOrTools}
				<Accordion.Root class="mt-4 w-full" type="multiple">
					<!-- Completed reasoning section -->
					{#if completedReasoningParts.length > 0}
						<Accordion.Item value="reasoning">
							<Accordion.Trigger>
								<p class="flex items-center gap-2">
									<Brain size={16} /> Reasoning summaries ({completedReasoningParts.length})
								</p>
							</Accordion.Trigger>
							<Accordion.Content class="prose- space-y-4">
								{#each completedReasoningParts as part, idx (idx)}
									{#if part.type === 'reasoning' && 'text' in part}
										<div>
											{@html marked(part.text)}
										</div>
									{/if}
								{/each}
							</Accordion.Content>
						</Accordion.Item>
					{/if}

					<!-- Tool calls sections -->
					{#each Object.entries(toolGroups) as [toolType, tools] (toolType)}
						{@const IconComponent = getToolIcon(toolType)}
						{#if tools.length > 0}
							<Accordion.Item value={toolType}>
								<Accordion.Trigger>
									<div class="flex items-center gap-2">
										<IconComponent size={16} />
										<span>{getToolLabel(toolType)}</span>
										<span class="text-xs text-muted-foreground">({tools.length})</span>
									</div>
								</Accordion.Trigger>
								<Accordion.Content>
									<div class="space-y-2 pl-4">
										{#each tools as tool, toolIndex (toolIndex)}
											{#if tool.type === 'tool-study_plan'}
												<ToolWrapper>
													Added {tool.input?.type} "{tool.input?.title}"
												</ToolWrapper>
											{:else if tool.type === 'tool-web_search'}
												<ToolWrapper>
													Searched for "{tool.input?.query}"
												</ToolWrapper>
											{:else if tool.type === 'tool-flashcards'}
												<ToolWrapper>
													Created "{tool.input?.term}"
												</ToolWrapper>
											{/if}
										{/each}
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/if}
					{/each}
				</Accordion.Root>
			{/if}
		</div>
	{/if}
</li>
