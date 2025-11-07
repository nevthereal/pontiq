<script lang="ts">
	import * as Item from '$lib/components/ui/item';
	import { resolve } from '$app/paths';
	import Loading from '$lib/components/Loading.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { getUser } from '$lib/remote/auth.remote';
	import { getSubjectsWithProjects } from '$lib/remote/projects.remote';
	import { Plus } from '@lucide/svelte';
	import Muted from '$lib/components/Muted.svelte';
</script>

<div class="p-6">
	<svelte:boundary>
		{@const user = await getUser()}
		{#if user}
			{#if user.isApproved}
				<Button href="/projects/create" class="mb-4"><Plus /> Create project</Button>
				{#each await getSubjectsWithProjects() as sub (sub.id)}
					<div class="mb-2">
						<h1 class="mb-2 text-xl">{sub.title}:</h1>
						<Item.Group class="grid grid-cols-4 gap-2">
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
				{/each}
			{:else}
				<p class="mt-8 text-center font-mono">Your account is not approved. Please request.</p>
			{/if}
		{/if}
		{#snippet pending()}
			<Loading thing="Projects" />
		{/snippet}
		{#snippet failed()}
			<p>Something went wrong here</p>
		{/snippet}
	</svelte:boundary>
</div>
