<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		front: string;
		back: string;
		// Optional richer content
		frontContent?: Snippet;
		backContent?: Snippet;

		// Allow parent control via bind:flipped
		flipped?: boolean;

		disabled?: boolean;
		class?: string;
	};

	let {
		front,
		back,
		frontContent,
		backContent,
		flipped = $bindable(false),
		disabled = false,
		class: className = ''
	}: Props = $props();

	function toggle() {
		if (!disabled) flipped = !flipped;
	}
</script>

<button
	type="button"
	aria-pressed={flipped}
	aria-label="Flip flashcard"
	{disabled}
	onclick={toggle}
	style="perspective: 1200px;"
	class={cn(
		'relative w-full select-none',
		'rounded-2xl',
		'focus:outline-none focus-visible:ring-2',
		disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
		className
	)}
>
	<div
		class={cn(
			'relative h-full w-full',
			'aspect-3/2',
			'transition-transform duration-200 motion-reduce:duration-0',
			'transform-3d',
			flipped ? 'transform-[rotateY(180deg)]' : 'transform-[rotateY(0deg)]'
		)}
	>
		<!-- FRONT -->
		<div
			class={cn(
				'absolute inset-0',
				'rounded-2xl border bg-card text-card-foreground',
				'shadow-sm',
				'p-6 sm:p-8',
				'flex items-center justify-center text-center',
				'backface-hidden'
			)}
		>
			<div class="w-full">
				<div class="text-xs font-medium tracking-wide text-muted-foreground">TERM</div>

				{#if frontContent}
					{@render frontContent()}
				{:else}
					<div class="mt-2 text-2xl font-semibold sm:text-3xl">
						{front}
					</div>
				{/if}

				<div class="mt-6 text-xs">Click to flip</div>
			</div>
		</div>

		<!-- BACK -->
		<div
			class={cn(
				'absolute inset-0',
				'rounded-2xl',
				'shadow-sm',
				'p-6 sm:p-8',
				'flex items-center justify-center text-center',
				'border bg-card text-card-foreground',
				'backface-hidden',
				'transform-[rotateY(180deg)]'
			)}
		>
			<div class="w-full">
				<div class="text-xs font-medium tracking-wide text-muted-foreground">DEFINITION</div>

				{#if backContent}
					{@render backContent()}
				{:else}
					<div class="mt-2 text-lg leading-relaxed sm:text-xl">
						{back}
					</div>
				{/if}

				<div class="mt-6 text-xs">Click to flip back</div>
			</div>
		</div>
	</div>
</button>
