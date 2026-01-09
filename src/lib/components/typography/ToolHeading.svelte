<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<h1 class="flex items-center gap-2 text-3xl font-extrabold">{@render children()}</h1>
