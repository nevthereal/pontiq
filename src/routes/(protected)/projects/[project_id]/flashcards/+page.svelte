<script lang="ts">
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';

	import { getFlashCards } from '$lib/remote/tools.remote';
	import { CreditCard } from '@lucide/svelte';

	let { params } = $props();
</script>

<div>
	<ToolHeading>
		<CreditCard /> Flashcards
	</ToolHeading>
	<Accordion.Root type="single">
		{#each await getFlashCards(params.project_id) as fc (fc.id)}
			<Accordion.Item value={fc.id}>
				<Accordion.Trigger>{fc.term}</Accordion.Trigger>
				<Accordion.Content>{fc.definition}</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</div>
