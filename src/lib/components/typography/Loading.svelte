<script lang="ts">
	import { Spinner } from './ui/spinner';

	let { thing, class: className }: { thing: string; class?: string } = $props();
</script>

<p class={['flex items-center gap-1 font-mono italic', className]}>
	<Spinner class="h-1lh" />Loading {thing}...
</p>
