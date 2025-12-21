<script lang="ts">
	import DOMPurify from 'isomorphic-dompurify';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import type { MyUIMessage } from '$lib/server/ai';
	import * as Item from '$lib/components/ui/item/index.js';
	import { FileText, Brain } from '@lucide/svelte';
	import { marked } from '$lib/utils';
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
						<div class="prose dark:prose-invert">
							<!-- eslint-disable svelte/no-at-html-tags -->
							{@html DOMPurify.sanitize(await marked(part.text))}
						</div>
					{/if}
				{/each}
			</Item.Content>
		</Item.Root>
	{:else if message.role === 'assistant'}
		{@const specialParts = {
			reasoning: message.parts.filter((p) => p.type === 'reasoning'),
			studyStep: message.parts.filter((p) => p.type === 'tool-study_plan'),
			flashcard: message.parts.filter((p) => p.type === 'tool-flashcards'),
			webSearch: message.parts.filter((p) => p.type === 'tool-web_search')
		}}
		<div in:fade|global class="flex flex-col">
			<!-- Text content -->
			{#each message.parts as part, idx (idx)}
				{#if part.type === 'text'}
					<div class="prose max-w-full dark:prose-invert">
						<!-- eslint-disable svelte/no-at-html-tags -->
						{@html DOMPurify.sanitize(await marked(part.text))}
					</div>
				{:else if part.type === 'reasoning' && part.state === 'streaming'}
					<p class="my-2 flex animate-pulse items-center gap-2 text-muted-foreground select-none">
						<Brain size={14} /> Reasoning
					</p>
				{/if}
			{/each}
			<Accordion.Root type="single">
				{#if specialParts.flashcard.length}
					<Accordion.Item value="flashcards">
						<Accordion.Trigger>Flashcards ({specialParts.flashcard.length})</Accordion.Trigger>
						<Accordion.Content
							>{#each specialParts.flashcard as f, idx (idx)}
								<ToolWrapper>Generated {f.input?.term}</ToolWrapper>
							{/each}</Accordion.Content
						>
					</Accordion.Item>
				{/if}
				{#if specialParts.studyStep.length}
					<Accordion.Item value="studyplan">
						<Accordion.Trigger>Study Plan ({specialParts.studyStep.length})</Accordion.Trigger>
						<Accordion.Content
							>{#each specialParts.studyStep as f, idx (idx)}
								<ToolWrapper>Added {f.input?.type} {f.input?.title}</ToolWrapper>
							{/each}</Accordion.Content
						>
					</Accordion.Item>
				{/if}
				{#if specialParts.webSearch.length}
					<Accordion.Item value="websearch">
						<Accordion.Trigger>Web search ({specialParts.webSearch.length})</Accordion.Trigger>
						<Accordion.Content
							>{#each specialParts.webSearch as f, idx (idx)}
								<ToolWrapper>Searched for {f.input?.query}</ToolWrapper>
							{/each}</Accordion.Content
						>
					</Accordion.Item>
				{/if}
				{#if specialParts.reasoning.length}
					<Accordion.Item value="reasoning">
						<Accordion.Trigger
							>Reasoning Summaries ({specialParts.reasoning.length})</Accordion.Trigger
						>
						<Accordion.Content
							>{#each specialParts.reasoning as r, idx (idx)}
								<p class="my-2 text-muted-foreground">
									{@html DOMPurify.sanitize(await marked(r.text))}
								</p>
							{/each}</Accordion.Content
						>
					</Accordion.Item>
				{/if}
			</Accordion.Root>
		</div>
	{/if}
</li>
