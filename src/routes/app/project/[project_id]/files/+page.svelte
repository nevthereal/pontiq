<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';

	import { getFiles } from '$lib/remote/files.remote';
	import Loading from '$lib/components/typography/Loading.svelte';
	import File from '$lib/components/files/File.svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { resolve } from '$app/paths';
	import { generateSvelteHelpers, UploadDropzone } from '@uploadthing/svelte';
	import { toast } from 'svelte-sonner';
	import type { MyRouter } from '$lib/server/uploadthing';
	import { FileX, Folder, Upload } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import { settled, tick } from 'svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let { params } = $props();
	let open = $state(false);

	const { createUploader } = generateSvelteHelpers<MyRouter>();

	const uploader = $derived(
		createUploader('uploader', {
			uploadProgressGranularity: 'coarse',
			onClientUploadComplete: async () => {
				await tick();
				toast.success('Upload Completed');
				getFiles(params.project_id).refresh();
				await settled();
				open = false;
			},
			onUploadError: (e) => {
				toast.error(e.message);
			},
			config: { cn: twMerge },
			url: resolve('/app/project/[project_id]/api/upload', {
				project_id: params.project_id
			})
		})
	);
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div class="flex justify-between">
		<ToolHeading>
			<Folder /> Files
		</ToolHeading>
		{#if (await getFiles(params.project_id)).length}
			{@render uploadDrawer()}
		{/if}
	</div>
	<div class="min-h-0 flex-1 overflow-y-scroll">
		<svelte:boundary onerror={(e) => console.error(e)}>
			{#snippet pending()}
				<Loading thing="files" />
			{/snippet}
			{#snippet failed()}
				<p>Failed to load files</p>
			{/snippet}
			{@const files = await getFiles(params.project_id)}
			{#if files.length}
				<ul class="grid grid-cols-3 gap-2 xl:grid-cols-4">
					{#each files as file (file.id)}
						<File {file} />
					{/each}
				</ul>
			{:else}
				<Empty.Root class="border border-dashed">
					<Empty.Header>
						<Empty.Media variant="icon">
							<FileX />
						</Empty.Media>
						<Empty.Title>No Files</Empty.Title>
						<Empty.Description>You do not have any files yet</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						{@render uploadDrawer()}
					</Empty.Content>
				</Empty.Root>
			{/if}
		</svelte:boundary>
	</div>
</div>

{#snippet uploadDrawer()}
	<Drawer.Root bind:open>
		<Drawer.Trigger class={buttonVariants()}><Upload /> Upload</Drawer.Trigger>
		<Drawer.Content>
			<div class="mx-auto mb-6 max-w-2xl">
				<Drawer.Header>
					<Drawer.Title>Upload files</Drawer.Title>
				</Drawer.Header>
				<UploadDropzone
					{uploader}
					class="p-6 ut-allowed-content:text-muted-foreground ut-label:text-foreground"
				>
					<i slot="upload-icon">
						<Upload />
					</i>

					<span class={buttonVariants()} slot="button-content" let:state>
						{state.isUploading ? `Uploading... ${state.uploadProgress}%` : 'Pick files'}
					</span>
					<span slot="label" let:state>
						{state.ready ? 'Drag and drop files here' : 'Loading...'}
					</span>
					<span slot="allowed-content" let:state>
						You can choose between {state.fileTypes.join(', ')} files
					</span>
				</UploadDropzone>
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/snippet}
