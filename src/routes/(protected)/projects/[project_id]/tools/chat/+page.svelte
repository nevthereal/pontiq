<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';

	let { params } = $props();
</script>

<ChatContainer projectId={params.project_id} />
