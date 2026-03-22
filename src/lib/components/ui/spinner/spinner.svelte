<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { IconProps } from '@lucide/svelte';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	type SpinnerProps = Omit<IconProps, 'name' | 'color'> & {
		class?: string | null;
		color?: string | null;
		stroke?: string | null;
		role?: string | null;
		'aria-label'?: string | null;
	};

	let {
		class: className,
		role,
		// we add color and stroke for compatibility with different icon libraries props
		color,
		stroke,
		'aria-label': ariaLabel,
		...restProps
	}: SpinnerProps = $props();
</script>

<Loader2Icon
	role={role ?? 'status'}
	color={color ?? undefined}
	stroke={stroke ?? undefined}
	aria-label={ariaLabel ?? 'Loading'}
	class={cn('size-4 animate-spin', className)}
	{...(restProps as Omit<IconProps, 'name'>)}
/>
