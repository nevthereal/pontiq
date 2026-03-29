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
	import type { StudyStepType } from '$lib/things';
	import type { Component } from 'svelte';
	import { marked } from '$lib/things';
	import { fade, slide } from 'svelte/transition';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let { message }: { message: MyUIMessage } = $props();

	type ToolType = `tool-${string}`;
	type GroupedPart =
		| { kind: 'text'; content: string }
		| { kind: 'reasoning'; text: string; state: string | undefined }
		| { kind: 'tool-group'; toolType: ToolType; items: Array<Record<string, unknown>> };
	type ToolPart = Extract<MyUIMessage['parts'][number], { type: `tool-${string}` }>;

	type ToolItemDisplay = {
		title: string;
		subtitle?: string;
		description?: string;
		meta?: {
			icon?: Component<IconProps>;
			text: string;
		};
		badge?: {
			icon?: Component<IconProps>;
			text: string;
		};
		itemIcon?: Component<IconProps>;
	};

	type ToolDisplayConfig = {
		icon: Component<IconProps>;
		label?: string;
		getItemDisplay?: (item: Record<string, unknown>) => ToolItemDisplay;
	};

	function isToolPart(part: MyUIMessage['parts'][number]): part is ToolPart {
		return part.type.startsWith('tool-');
	}

	// Group consecutive tool calls of the same type
	function groupParts(parts: MyUIMessage['parts']): GroupedPart[] {
		const result: GroupedPart[] = [];
		let currentToolGroup: { toolType: ToolType; items: Array<Record<string, unknown>> } | null =
			null;
		let currentReasoningGroup: { texts: string[]; states: Array<string | undefined> } | null = null;

		function flushToolGroup() {
			if (!currentToolGroup) return;
			result.push({ kind: 'tool-group', ...currentToolGroup });
			currentToolGroup = null;
		}

		function flushReasoningGroup() {
			if (!currentReasoningGroup) return;
			result.push({
				kind: 'reasoning',
				text: currentReasoningGroup.texts.join('\n\n'),
				state:
					currentReasoningGroup.states.find((state) => state === 'streaming') ??
					currentReasoningGroup.states.at(-1)
			});
			currentReasoningGroup = null;
		}

		for (const part of parts) {
			if (part.type === 'text') {
				flushToolGroup();
				flushReasoningGroup();
				result.push({ kind: 'text', content: part.text });
			} else if (part.type === 'reasoning') {
				flushToolGroup();
				if (currentReasoningGroup) {
					currentReasoningGroup.texts.push(part.text);
					currentReasoningGroup.states.push(part.state);
				} else {
					currentReasoningGroup = { texts: [part.text], states: [part.state] };
				}
			} else if (isToolPart(part)) {
				flushReasoningGroup();
				const toolType = part.type;
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

		flushToolGroup();
		flushReasoningGroup();

		return result;
	}

	const groupedParts = $derived(message.role === 'assistant' ? groupParts(message.parts) : []);

	const markdownCache = new SvelteMap<string, string>();

	function renderMarkdown(text: string): string {
		const cached = markdownCache.get(text);
		if (cached) return cached;
		const html = DOMPurify.sanitize(String(marked.parse(text)));
		markdownCache.set(text, html);
		return html;
	}

	// Track expanded state (collapsed by default for reasoning, expanded for tools)
	let expandedState = $state<Record<number, boolean>>({});

	function toggleExpanded(index: number) {
		expandedState[index] = !expandedState[index];
	}

	function toggleReasoning(index: number) {
		expandedState[index] = !(expandedState[index] ?? false);
	}

	function isExpanded(index: number, defaultValue: boolean): boolean {
		return expandedState[index] ?? defaultValue;
	}

	function isReasoningStreaming(part: Extract<GroupedPart, { kind: 'reasoning' }>): boolean {
		return part.state === 'streaming';
	}

	function isReasoningExpanded(
		part: Extract<GroupedPart, { kind: 'reasoning' }>,
		index: number
	): boolean {
		return isReasoningStreaming(part) || isExpanded(index, false);
	}

	// Study step type configuration with icons
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

	function getStringValue(item: Record<string, unknown>, keys: string[]): string | undefined {
		for (const key of keys) {
			const value = item[key];
			if (typeof value !== 'string') continue;
			const trimmed = value.trim();
			if (trimmed.length) return trimmed;
		}
		return undefined;
	}

	function getFormattedToolLabel(toolType: ToolType): string {
		return toolType
			.replace(/^tool-/, '')
			.split(/[_-]+/)
			.filter(Boolean)
			.map((part) => part[0]?.toUpperCase() + part.slice(1))
			.join(' ');
	}

	function getDefaultToolItemDisplay(item: Record<string, unknown>): ToolItemDisplay {
		const title =
			getStringValue(item, ['title', 'term', 'query', 'name', 'label', 'question', 'prompt']) ??
			getStringValue(item, Object.keys(item)) ??
			'Tool item';
		const subtitle = getStringValue(item, ['definition', 'summary', 'type', 'status', 'url']);
		const descriptionSource = getStringValue(item, ['description', 'details', 'content']);

		return {
			title,
			subtitle,
			description: descriptionSource !== subtitle ? descriptionSource : undefined,
			itemIcon: Sparkles
		};
	}

	const toolConfig: Record<string, ToolDisplayConfig> = {
		'tool-flashcards': {
			icon: Layers,
			label: 'Flashcards'
		},
		'tool-study_plan': {
			icon: Calendar,
			label: 'Study Plan',
			getItemDisplay: (item) => {
				const stepConfig = getStudyStepConfig(item.type as string | undefined);
				const dateText = getStudyPlanDate(item);
				return {
					title: getStringValue(item, ['title']) ?? 'Study step',
					description: getStudyPlanDescription(item),
					meta: dateText
						? {
								icon: Calendar,
								text: dateText
							}
						: undefined,
					badge: {
						icon: stepConfig.icon,
						text: stepConfig.label
					},
					itemIcon: stepConfig.icon
				};
			}
		},
		'tool-web_search': {
			icon: Search,
			label: 'Web Search'
		}
	};

	function getToolDisplayConfig(toolType: ToolType): Required<ToolDisplayConfig> {
		const config = toolConfig[toolType];
		return {
			icon: config?.icon ?? Sparkles,
			label: config?.label ?? getFormattedToolLabel(toolType),
			getItemDisplay: config?.getItemDisplay ?? getDefaultToolItemDisplay
		};
	}

	const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
	const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	function getStudyPlanDate(item: Record<string, unknown>): string | undefined {
		const raw = item.date;
		const date =
			typeof raw === 'string' || raw instanceof Date ? new Date(raw as string | Date) : null;
		if (!date || Number.isNaN(date.getTime())) return undefined;
		const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
		return hasTime ? dateTimeFormatter.format(date) : dateFormatter.format(date);
	}

	function getStudyPlanDescription(item: Record<string, unknown>): string | undefined {
		const description = item.description;
		if (typeof description !== 'string') return undefined;
		const trimmed = description.trim();
		return trimmed.length ? trimmed : undefined;
	}
</script>

<li in:fade|global>
	{#if message.role === 'user'}
		{@render userMessage(message)}
	{:else if message.role === 'assistant'}
		{@render assistantMessage(groupedParts)}
	{/if}
</li>

{#snippet userMessage(message: MyUIMessage)}
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
						{@html renderMarkdown(part.text)}
					</div>
				{/if}
			{/each}
		</Item.Content>
	</Item.Root>
{/snippet}

{#snippet assistantMessage(groupedParts: GroupedPart[])}
	<div in:fade|global class="flex flex-col gap-3">
		{#each groupedParts as part, idx (idx)}
			{#if part.kind === 'text'}
				{@render assistantText(part)}
			{:else if part.kind === 'reasoning'}
				{@render assistantReasoning(part, idx)}
			{:else if part.kind === 'tool-group'}
				{@render assistantToolGroup(part, idx)}
			{/if}
		{/each}
	</div>
{/snippet}

{#snippet assistantText(part: Extract<GroupedPart, { kind: 'text' }>)}
	<div class="prose max-w-full dark:prose-invert">
		<!-- eslint-disable svelte/no-at-html-tags -->
		{@html renderMarkdown(part.content)}
	</div>
{/snippet}

{#snippet assistantReasoning(part: Extract<GroupedPart, { kind: 'reasoning' }>, idx: number)}
	<button
		onclick={() => toggleReasoning(idx)}
		class="group flex w-full cursor-pointer items-center gap-2 py-1 text-left text-sm transition-colors"
	>
		<Brain size={14} class="text-muted-foreground" />
		<span class="flex-1 text-muted-foreground">Reasoning</span>
		<ChevronDown
			size={14}
			class="text-muted-foreground transition-transform duration-200 {isReasoningExpanded(part, idx)
				? 'rotate-180'
				: ''}"
		/>
	</button>
	{#if isReasoningExpanded(part, idx)}
		<div transition:slide={{ duration: 200 }} class="py-2 pl-6">
			<div class="prose prose-sm max-w-full text-muted-foreground dark:prose-invert">
				<!-- eslint-disable svelte/no-at-html-tags -->
				{@html renderMarkdown(part.text)}
			</div>
		</div>
	{/if}
{/snippet}

{#snippet assistantToolGroup(part: Extract<GroupedPart, { kind: 'tool-group' }>, idx: number)}
	{@const config = getToolDisplayConfig(part.toolType)}
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
					class="text-muted-foreground transition-transform duration-200 {isExpanded(idx, true)
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
							{@const display = config.getItemDisplay(item)}
							{@const ItemIcon = display.itemIcon ?? Sparkles}
							<div class="flex flex-col gap-2 rounded-lg border p-3">
								<div class="flex items-center gap-2">
									<ItemIcon size={12} class="text-muted-foreground" />
									<span class="font-medium text-foreground">{display.title}</span>
								</div>
								{#if display.meta}
									<p class="flex items-center gap-1 text-xs text-muted-foreground">
										{#if display.meta.icon}
											{@const MetaIcon = display.meta.icon}
											<MetaIcon size={12} />
										{/if}
										{display.meta.text}
									</p>
								{/if}
								{#if display.subtitle}
									<p class="pl-5 text-sm text-muted-foreground">
										{display.subtitle}
									</p>
								{/if}
								{#if display.description}
									<p class="text-sm text-muted-foreground">
										{display.description}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				</Dialog.Content>
			</Dialog.Root>
		</div>

		<!-- Horizontally scrollable flashcard component cards (collapsible, expanded by default) -->
		{#if isExpanded(idx, true)}
			<div transition:slide={{ duration: 200 }} class="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
				{#each part.items as item, itemIdx (itemIdx)}
					{@const display = config.getItemDisplay(item)}
					<div class="flex max-w-64 min-w-48 shrink-0 flex-col gap-2 rounded-lg border p-3">
						<div class="flex items-start gap-2">
							<span class="line-clamp-2 text-sm font-medium text-foreground">{display.title}</span>
						</div>
						{#if display.meta}
							<p class="flex items-center gap-1 text-xs text-muted-foreground">
								{#if display.meta.icon}
									{@const MetaIcon = display.meta.icon}
									<MetaIcon size={12} />
								{/if}
								{display.meta.text}
							</p>
						{/if}
						{#if display.badge}
							<Badge>
								{#if display.badge.icon}
									{@const BadgeIcon = display.badge.icon}
									<BadgeIcon size={10} />
								{/if}
								{display.badge.text}
							</Badge>
						{:else if display.subtitle}
							<p class="line-clamp-2 text-xs text-muted-foreground">
								{display.subtitle}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}
