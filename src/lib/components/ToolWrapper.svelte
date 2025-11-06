<script lang="ts">
	import { ToolCase, type IconProps } from '@lucide/svelte';
	import type { Component, Snippet } from 'svelte';

	let {
		children,
		icon,
		className
	}: { children: Snippet; icon?: Component<IconProps>; className?: string } = $props();

	const Icon = icon || ToolCase;
</script>

<p class={['my-2 flex items-center gap-2 text-muted-foreground select-none', className]}>
	<Icon size={14} />
	{@render children?.()}
</p>
