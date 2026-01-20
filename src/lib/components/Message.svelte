<script lang="ts">
	import DOMPurify from 'isomorphic-dompurify';
	import type { MyUIMessage } from '$lib/server/ai';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		FileText,
		Brain,
		ChevronDown,
		ChevronRight,
		Layers,
		Calendar,
		Search,
		Sparkles,
		// Study step type icons
		Flag,
		BookOpen,
		ClipboardList,
		FolderKanban,
		GraduationCap,
		RotateCcw,
		Coffee,
		type IconProps
	} from '@lucide/svelte';
	import type { studyStepTypes } from '$lib/server/db/schema/tools.sql';
	import type { Component } from 'svelte';
	import { marked } from '$lib/utils';
	import { fade, slide } from 'svelte/transition';
	import Badge from './ui/badge/badge.svelte';

	let { message }: { message: MyUIMessage } = $props();

	type ToolType = 'tool-flashcards' | 'tool-study_plan' | 'tool-web_search';
	type GroupedPart =
		| { kind: 'text'; content: string }
		| { kind: 'reasoning'; text: string; state: string | undefined }
		| { kind: 'tool-group'; toolType: ToolType; items: Array<Record<string, unknown>> };

	// Group consecutive tool calls of the same type
	function groupParts(parts: MyUIMessage['parts']): GroupedPart[] {
		const result: GroupedPart[] = [];
		let currentToolGroup: { toolType: ToolType; items: Array<Record<string, unknown>> } | null =
			null;

		for (const part of parts) {
			if (part.type === 'text') {
				// Flush any pending tool group
				if (currentToolGroup) {
					result.push({ kind: 'tool-group', ...currentToolGroup });
					currentToolGroup = null;
				}
				result.push({ kind: 'text', content: part.text });
			} else if (part.type === 'reasoning') {
				// Flush any pending tool group
				if (currentToolGroup) {
					result.push({ kind: 'tool-group', ...currentToolGroup });
					currentToolGroup = null;
				}
				result.push({ kind: 'reasoning', text: part.text, state: part.state });
			} else if (
				part.type === 'tool-flashcards' ||
				part.type === 'tool-study_plan' ||
				part.type === 'tool-web_search'
			) {
				const toolType = part.type as ToolType;
				if (currentToolGroup && currentToolGroup.toolType === toolType) {
					// Add to existing group
					currentToolGroup.items.push(part.input ?? {});
				} else {
					// Flush previous group if different type
					if (currentToolGroup) {
						result.push({ kind: 'tool-group', ...currentToolGroup });
					}
					// Start new group
					currentToolGroup = { toolType, items: [part.input ?? {}] };
				}
			}
		}

		// Flush any remaining tool group
		if (currentToolGroup) {
			result.push({ kind: 'tool-group', ...currentToolGroup });
		}

		return result;
	}

	const groupedParts = $derived(message.role === 'assistant' ? groupParts(message.parts) : []);

	// Track expanded state (collapsed by default for reasoning, expanded for tools)
	let expandedState = $state<Record<number, boolean>>({});

	function toggleExpanded(index: number) {
		expandedState[index] = !expandedState[index];
	}

	function isExpanded(index: number, defaultValue: boolean): boolean {
		return expandedState[index] ?? defaultValue;
	}

	// Study step type configuration with icons
	type StudyStepType = (typeof studyStepTypes)[number];

	const studyStepTypeConfig: Record<
		StudyStepType,
		{
			icon: Component<IconProps>;
			label: string;
		}
	> = {
		milestone: { icon: Flag, label: 'Milestone' },
		lesson: { icon: BookOpen, label: 'Lesson' },
		assignment: { icon: ClipboardList, label: 'Assignment' },
		project: { icon: FolderKanban, label: 'Project' },
		exam: { icon: GraduationCap, label: 'Exam' },
		review: { icon: RotateCcw, label: 'Review' },
		break: { icon: Coffee, label: 'Break' }
	};

	function getStudyStepConfig(type: string | undefined) {
		if (!type || !(type in studyStepTypeConfig)) {
			return studyStepTypeConfig.lesson; // default fallback
		}
		return studyStepTypeConfig[type as StudyStepType];
	}

	const toolConfig: Record<
		ToolType,
		{
			icon: Component<IconProps>;
			label: string;
			getItemText: (item: Record<string, unknown>) => string;
			getItemSubtext: (item: Record<string, unknown>) => string | undefined;
		}
	> = {
		'tool-flashcards': {
			icon: Layers,
			label: 'Flashcards',
			getItemText: (item) => (item.term as string) ?? '',
			getItemSubtext: (item) => item.definition as string | undefined
		},
		'tool-study_plan': {
			icon: Calendar,
			label: 'Study Plan',
			getItemText: (item) => (item.title as string) ?? '',
			getItemSubtext: (item) => item.type as string | undefined
		},
		'tool-web_search': {
			icon: Search,
			label: 'Web Search',
			getItemText: (item) => (item.query as string) ?? '',
			getItemSubtext: () => undefined
		}
	};
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
		<div in:fade|global class="flex flex-col gap-3">
			{#each groupedParts as part, idx (idx)}
				{#if part.kind === 'text'}
					<div class="prose max-w-full dark:prose-invert">
						<!-- eslint-disable svelte/no-at-html-tags -->
						{@html DOMPurify.sanitize(await marked(part.content))}
					</div>
				{:else if part.kind === 'reasoning'}
					{#if part.state === 'streaming'}
						<p
							class="my-2 flex animate-pulse items-center gap-2 text-sm text-muted-foreground select-none"
						>
							<Brain size={14} /> Reasoning...
						</p>
					{:else}
						<button
							onclick={() => toggleExpanded(idx)}
							class="group flex w-full cursor-pointer items-center gap-2 py-1 text-left text-sm transition-colors"
						>
							<Brain size={14} class="text-muted-foreground" />
							<span class="flex-1 text-muted-foreground">Reasoning</span>
							<ChevronDown
								size={14}
								class="text-muted-foreground transition-transform duration-200 {isExpanded(
									idx,
									false
								)
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if isExpanded(idx, false)}
							<div transition:slide={{ duration: 200 }} class="py-2 pl-6">
								<p class="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
									{@html DOMPurify.sanitize(await marked(part.text))}
								</p>
							</div>
						{/if}
					{/if}
				{:else if part.kind === 'tool-group'}
					{@const config = toolConfig[part.toolType]}
					{@const Icon = config.icon}
					<div class="flex flex-col gap-2">
						<!-- Collapsible header with label and view all button -->
						<div class="flex items-center gap-2">
							<button
								onclick={() => toggleExpanded(idx)}
								class="flex cursor-pointer items-center gap-2 py-1 text-left text-sm transition-colors"
							>
								<Icon size={14} class="text-muted-foreground" />
								<span class="font-medium text-muted-foreground">
									{config.label}
									<span class="ml-1">({part.items.length})</span>
								</span>
								<ChevronDown
									size={14}
									class="text-muted-foreground transition-transform duration-200 {isExpanded(
										idx,
										true
									)
										? 'rotate-180'
										: ''}"
								/>
							</button>

							<!-- View all dialog trigger -->
							<Dialog.Root>
								<Dialog.Trigger
									class="ml-auto flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
								>
									View all <ChevronRight size={12} />
								</Dialog.Trigger>
								<Dialog.Content class="max-w-2xl">
									<Dialog.Header>
										<Dialog.Title class="flex items-center gap-2">
											<Icon size={18} />
											{config.label} ({part.items.length})
										</Dialog.Title>
									</Dialog.Header>
									<div class="max-h-[60vh] space-y-2 overflow-y-auto py-4">
										{#each part.items as item, itemIdx (itemIdx)}
											<div class="flex flex-col gap-2 rounded-lg border p-3">
												<div class="flex items-center gap-2">
													{#if part.toolType === 'tool-study_plan'}
														{@const stepConfig = getStudyStepConfig(item.type as string)}
														{@const StepIcon = stepConfig.icon}
														<StepIcon size={12} class="text-muted-foreground" />
													{:else}
														<Sparkles size={12} class="text-muted-foreground" />
													{/if}
													<span class="font-medium text-foreground">{config.getItemText(item)}</span
													>
												</div>
												{#if part.toolType === 'tool-study_plan' && config.getItemSubtext(item)}
													{@const stepConfig = getStudyStepConfig(item.type as string)}
													{@const StepIcon = stepConfig.icon}
													<span
														class="flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
													>
														<StepIcon size={10} />
														{stepConfig.label}
													</span>
												{:else if config.getItemSubtext(item)}
													<p class="pl-5 text-sm text-muted-foreground">
														{config.getItemSubtext(item)}
													</p>
												{/if}
											</div>
										{/each}
									</div>
								</Dialog.Content>
							</Dialog.Root>
						</div>

						<!-- Horizontally scrollable cards (collapsible, expanded by default) -->
						{#if isExpanded(idx, true)}
							<div
								transition:slide={{ duration: 200 }}
								class="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2"
							>
								{#each part.items as item, itemIdx (itemIdx)}
									<div class="flex max-w-64 min-w-48 shrink-0 flex-col gap-2 rounded-lg border p-3">
										<div class="flex items-start gap-2">
											<span class="line-clamp-2 text-sm font-medium text-foreground"
												>{config.getItemText(item)}</span
											>
										</div>
										{#if part.toolType === 'tool-study_plan' && config.getItemSubtext(item)}
											{@const stepConfig = getStudyStepConfig(item.type as string)}
											{@const StepIcon = stepConfig.icon}
											<Badge>
												<StepIcon size={10} />
												{stepConfig.label}
											</Badge>
										{:else if config.getItemSubtext(item)}
											<p class="line-clamp-2 pl-5 text-xs text-muted-foreground">
												{config.getItemSubtext(item)}
											</p>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</li>
