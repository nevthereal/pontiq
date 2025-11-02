<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { File } from '$lib/server/db/schema';
	import { buttonVariants } from './ui/button';
	import { CircleFadingPlus, Ellipsis, FileText, SquareArrowUpRight, Trash2 } from '@lucide/svelte';
	import { attachments } from '$lib/chat.svelte';
	import { toast } from 'svelte-sonner';
	import { deleteFile } from '$lib/remote/files.remote';

	let { file }: { file: File } = $props();

	const extension = $derived(
		file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.') + 1) : ''
	);

	const slicedName = $derived(
		extension ? `${file.name.slice(0, 5)}...${extension}` : file.name.slice(0, 8) + '...'
	);
</script>

<li class="flex flex-col justify-between gap-2 rounded-md border p-2" title={file.name}>
	<div class="relative aspect-square overflow-hidden rounded-sm">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={buttonVariants({
					class: 'absolute top-2 right-2 z-10',
					size: 'icon',
					variant: 'secondary'
				})}><Ellipsis /></DropdownMenu.Trigger
			>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.Label>File</DropdownMenu.Label>
					<DropdownMenu.Separator />

					<DropdownMenu.Item
						disabled={attachments.isInChat(file)}
						onclick={() => attachments.add(file)}
						><CircleFadingPlus /> Add file to Chat</DropdownMenu.Item
					>
					<a href={file.utURL} target="_blank">
						<DropdownMenu.Item>
							<SquareArrowUpRight /> Open file
						</DropdownMenu.Item>
					</a>
					<DropdownMenu.Item
						onclick={async () =>
							toast.promise(deleteFile(file.id), {
								loading: 'Deleting file...',
								success: 'Successfully deleted file',
								error: (e) => `Something went wrong? ${e}`
							})}
						variant="destructive"><Trash2 />Delete File</DropdownMenu.Item
					>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		{#if file.type === 'image/jpeg' || file.type === 'image/png'}
			<img src={file.utURL} alt={file.name} class="h-full w-full object-cover" />
		{:else if file.type === 'application/pdf'}
			<div class="flex h-full w-full items-center justify-center bg-muted">
				<FileText class="size-20 text-muted-foreground" />
			</div>
		{/if}
	</div>
	<Tooltip.Provider>
		<Tooltip.Root delayDuration={100}>
			<Tooltip.Trigger class="no-scrollbar overflow-x-scroll font-mono text-xs"
				>{slicedName}</Tooltip.Trigger
			>
			<Tooltip.Content>
				<p>{file.name}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</li>
