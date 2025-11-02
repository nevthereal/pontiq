<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	let { children, params } = $props();
</script>

<Button
	variant="ghost"
	class="mt-2 mr-auto text-muted-foreground"
	href={resolve('/(protected)/projects/[project_id]', params)}><ArrowLeft /> All tools</Button
>
<div class="overflow-y-scroll">
	{@render children()}
</div>
