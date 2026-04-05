<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Item from '$lib/components/ui/item/index.js';

	import { getFiles } from '$lib/remote/files.remote';
	import Loading from '$lib/components/typography/Loading.svelte';
	import File from '$lib/components/files/File.svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';
	import { generateSvelteHelpers, UploadDropzone } from '@uploadthing/svelte';
	import { toast } from 'svelte-sonner';
	import type { MyRouter } from '$lib/server/uploadthing';
	import { FileX, Folder, Upload } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import { settled, tick } from 'svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { getFileLimit, subscribeToPro } from '$lib/remote/billing.remote';

	let { params } = $props();
	let open = $state(false);
	let upgrading = $state(false);

	const fileLimitQuery = $derived(getFileLimit({ projectId: params.project_id }));

	const { createUploader } = generateSvelteHelpers<MyRouter>();

	const uploader = $derived(
		createUploader('uploader', {
			uploadProgressGranularity: 'fine',
			onClientUploadComplete: async () => {
				await tick();
				toast.success('Upload Completed');
				await Promise.all([getFiles(params.project_id).refresh(), fileLimitQuery.refresh()]);
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

	async function handleUpgrade() {
		upgrading = true;
		try {
			const url = await subscribeToPro();
			if (url) window.location.href = url;
		} finally {
			upgrading = false;
		}
	}
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
				<svelte:boundary>
					{#snippet pending()}
						<Loading thing="upload limits" />
					{/snippet}
					{@const limit = await fileLimitQuery}
					{#if !limit.balance?.unlimited}
						<Item.Root variant="outline" size="sm" class="mb-4 bg-background">
							<Item.Content>
								<Item.Title>File upload limits</Item.Title>
								<Item.Description>
									{limit.balance?.remaining ?? 0}/{limit.balance?.granted ?? 0} uploads remaining for
									this project.
									{#if limit.balance?.nextResetAt}
										Resets on {Intl.DateTimeFormat().format(limit.balance.nextResetAt)}.
									{/if}
								</Item.Description>
							</Item.Content>
							<Item.Actions>
								<Button size="sm" onclick={handleUpgrade}>
									{#if upgrading}
										<Spinner />
									{/if}
									Upgrade
								</Button>
							</Item.Actions>
						</Item.Root>
					{/if}
					<UploadDropzone
						{uploader}
						disabled={!limit.allowed}
						class="p-6 ut-allowed-content:text-muted-foreground ut-label:text-foreground"
					>
						<i slot="upload-icon">
							<Upload />
						</i>

						<span class={buttonVariants()} slot="button-content" let:state>
							{#if !state.ready}
								Loading...
							{:else if state.isUploading}
								<Spinner /> Uploading... ({state.uploadProgress}%)
							{:else if !limit.allowed}
								Upgrade to upload
							{:else}
								Pick a file
							{/if}
						</span>
						<span slot="label" let:state>
							{#if !state.ready}
								Loading...
							{:else if !limit.allowed}
								This project has reached its file upload limit
							{:else}
								Drag and drop files here
							{/if}
						</span>
						<span slot="allowed-content" let:state>
							{#if !limit.allowed}
								Upgrade to upload more files to this project
							{:else}
								You can choose between {state.fileTypes.join(', ')} files
							{/if}
						</span>
					</UploadDropzone>
				</svelte:boundary>
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/snippet}
