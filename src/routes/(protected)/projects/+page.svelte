<script lang="ts">
	import * as Item from '$lib/components/ui/item';
	import { resolve } from '$app/paths';
	import Loading from '$lib/components/typography/Loading.svelte';
	import { getSubjectsWithProjects } from '$lib/remote/projects.remote';
	import Muted from '$lib/components/typography/Muted.svelte';
	import CreateDialog from '$lib/components/CreateDialog.svelte';
	import SiteHeading from '$lib/components/typography/SiteHeading.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Plus } from '@lucide/svelte';
</script>

<section>
	<div class="flex justify-between">
		<SiteHeading>Projects</SiteHeading>
		<svelte:boundary>
			{#snippet pending()}
				<Button size="sm" disabled><Plus />Create project</Button>
			{/snippet}
			<CreateDialog />
		</svelte:boundary>
	</div>
	<svelte:boundary>
		{#each await getSubjectsWithProjects() as sub (sub.id)}
			<div class="my-2">
				<h1 class="mb-2">{sub.title}:</h1>
				<Item.Group class="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
					{#each sub.projects as prj (prj.id)}
						<Item.Root variant="outline">
							{#snippet child({ props })}
								<a
									href={resolve(`/(protected)/projects/[project_id]`, { project_id: prj.id })}
									{...props}
								>
									<Item.Title>
										{prj.name}
									</Item.Title>
								</a>
							{/snippet}
						</Item.Root>
					{:else}
						<Muted>No projects in subject</Muted>
					{/each}
				</Item.Group>
			</div>
		{:else}
			<Muted>No subjects. Create one above!</Muted>
		{/each}

		{#snippet pending()}
			<Loading thing="Projects" />
		{/snippet}
		{#snippet failed()}
			<p>Something went wrong here</p>
		{/snippet}
	</svelte:boundary>
</section>
