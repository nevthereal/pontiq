<script lang="ts">
	import type { Flashcard } from '$lib/server/db/schema';
	import { cn } from '$lib/utils';
	import { PressedKeys } from 'runed';

	type Props = {
		flashcard: Flashcard;

		// Allow parent control via bind:flipped
		flipped?: boolean;

		disabled?: boolean;
		class?: string;
	};

	let {
		flashcard,
		flipped = $bindable(false),
		disabled = false,
		class: className = ''
	}: Props = $props();

	let buttonRef: HTMLButtonElement | null = $state(null);
	let pointerActivated = false;

	function toggle() {
		if (!disabled) flipped = !flipped;
	}

	function handlePointerDown(event: PointerEvent) {
		// Prevent pointer interactions from focusing the button (so space/keys don't get "stuck" on it).
		pointerActivated = true;
		event.preventDefault();
	}

	function handleClick() {
		toggle();

		if (pointerActivated) {
			pointerActivated = false;
			buttonRef?.blur();
		}
	}

	const keys = new PressedKeys();

	keys.onKeys(' ', () => toggle());
</script>

<button
	bind:this={buttonRef}
	type="button"
	aria-pressed={flipped}
	aria-label="Flip flashcard"
	{disabled}
	onpointerdown={handlePointerDown}
	onclick={handleClick}
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
				<div class="text-xs font-medium tracking-wide text-muted-foreground">
					TERM ({flashcard.rating})
				</div>

				<div class="mt-2 text-2xl font-semibold sm:text-3xl">
					{flashcard.term}
				</div>

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

				<div class="mt-2 text-lg leading-relaxed sm:text-xl">
					{flashcard.definition}
				</div>

				<div class="mt-6 text-xs">Click to flip back</div>
			</div>
		</div>
	</div>
</button>
