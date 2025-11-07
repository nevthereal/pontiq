<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Muted from '$lib/components/Muted.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { deleteFile, getAllFiles } from '$lib/remote/files.remote';
	import { BookText, FileText, Image, SquareArrowOutUpRight, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const allFiles = $derived(await getAllFiles());
</script>

<main class="p-6">
	<h1 class="mb-4 text-3xl font-bold">Files</h1>
	<section class="space-y-4">
		{#each allFiles as p (p.id)}
			<h2>{p.name}</h2>
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{#each p.files as f (f.id)}
					<Item.Root variant="outline">
						<Item.Media variant="icon"
							>{#if f.type.includes('image')}
								<Image />
							{:else if f.type.includes('pdf')}
								<BookText />
							{:else if f.type.includes('text')}
								<FileText />
							{/if}</Item.Media
						>
						<Item.Content>
							<Item.Title>
								<Tooltip.Provider delayDuration={100}>
									<Tooltip.Root>
										<Tooltip.Trigger class="font-mono"
											>{f.name.length >= 10 ? `${f.name.slice(0, 10)}…` : f.name}</Tooltip.Trigger
										>
										<Tooltip.Content>
											{f.name}
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							</Item.Title>
							<Item.Description
								>Uploaded on {Intl.DateTimeFormat('en-gb', {
									dateStyle: 'medium',
									timeStyle: 'short'
								}).format(f.uploaded)}</Item.Description
							>
						</Item.Content>
						<Item.Actions>
							<Button href={f.utURL} target="_blank" size="icon-sm" variant="outline"
								><SquareArrowOutUpRight /></Button
							>
							<Button
								onclick={async () => {
									toast.promise(deleteFile(f.id), {
										loading: 'Deleting file...',
										success: () => {
											getAllFiles().refresh();
											return 'Successfully deleted file';
										},
										error: (e) => `Something went wrong? ${e}`
									});
								}}
								size="icon-sm"
								variant="destructive"><Trash2 /></Button
							>
						</Item.Actions>
					</Item.Root>
				{:else}
					<Muted>No files in project</Muted>
				{/each}
			</div>
		{/each}
	</section>
</main>
