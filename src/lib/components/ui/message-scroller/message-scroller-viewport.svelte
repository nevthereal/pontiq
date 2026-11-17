<script lang="ts">
	import { MessageScroller as MessageScrollerPrimitive } from '@shadcn-svelte/primitives/message-scroller';
	import { cn } from '#lib/utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: MessageScrollerPrimitive.ViewportProps = $props();
</script>

<MessageScrollerPrimitive.Viewport
	bind:ref
	data-slot="message-scroller-viewport"
	class={cn(
		'scroll-fade-b scrollbar-thin scrollbar-gutter-stable data-autoscrolling:scrollbar-thumb-transparent data-autoscrolling:scrollbar-track-transparent size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain contain-content data-pending-scroll:invisible',
		className
	)}
	{...restProps}
/>
