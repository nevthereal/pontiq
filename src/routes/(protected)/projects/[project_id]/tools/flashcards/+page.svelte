<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';

	import { getFlashCards } from '$lib/remote/tools.remote';

	let { params } = $props();
</script>

<div>
	{#each await getFlashCards(params.project_id) as fc (fc.id)}
		<Accordion.Root type="single">
			<Accordion.Item value="item-1">
				<Accordion.Trigger>{fc.term}</Accordion.Trigger>
				<Accordion.Content>{fc.definition}</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	{/each}
</div>
