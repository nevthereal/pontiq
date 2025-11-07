<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, className }: { children: Snippet; className?: string } = $props();
</script>

<p class={['my-2 flex items-center gap-2 text-muted-foreground select-none', className]}>
	{@render children?.()}
</p>
