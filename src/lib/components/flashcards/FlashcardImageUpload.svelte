<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Upload, ImagePlus, Trash2 } from '@lucide/svelte';
	import { buttonVariants } from '#lib/components/ui/button/button.svelte';
	import Spinner from '#lib/components/ui/spinner/spinner.svelte';
	import { generateSvelteHelpers } from '@uploadthing/svelte';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { Button } from '#lib/components/ui/button/index.ts';
	import type { MyRouter } from '#lib/server/uploadthing.ts';

	let {
		projectId,
		label,
		value = $bindable(''),
		uploading = $bindable(false),
		disabled = false
	}: {
		projectId: string;
		label: string;
		value?: string;
		uploading?: boolean;
		disabled?: boolean;
	} = $props();

	let progress = $state(0);
	let active = true;
	onDestroy(() => {
		active = false;
		uploading = false;
	});

	async function upload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file || disabled || uploading) return;
		if (!file.type.startsWith('image/')) {
			toast.error('Choose an image file');
			return;
		}
		if (file.size > 16 * 1024 * 1024) {
			toast.error('Images must be 16 MB or smaller');
			return;
		}
		progress = 0;
		uploading = true;
		try {
			const { uploadFiles } = generateSvelteHelpers<MyRouter>({
				url: resolve('/app/project/[project_id]/api/upload', { project_id: projectId })
			});
			const [uploaded] = await uploadFiles('uploader', {
				files: [file],
				onUploadProgress: ({ progress: nextProgress }) => {
					if (active) progress = nextProgress;
				}
			});
			if (!uploaded) throw new Error('Image upload failed');
			if (active) value = uploaded.ufsUrl;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Image upload failed');
		} finally {
			if (active) uploading = false;
		}
	}
</script>

<div class="space-y-2.5">
	<div class="flex items-center justify-between gap-2">
		<p class="text-sm font-medium">
			{label} <span class="font-normal text-muted-foreground">(optional)</span>
		</p>
		{#if value}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				disabled={disabled || uploading}
				onclick={() => (value = '')}
			>
				<Trash2 /> Remove
			</Button>
		{/if}
	</div>
	<label
		class="group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-xl border border-dashed bg-background p-6 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/30 has-focus-visible:border-ring has-focus-visible:ring-2 has-focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:opacity-60"
	>
		<input
			type="file"
			accept="image/*"
			aria-label={value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
			onchange={upload}
			disabled={disabled || uploading}
			class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
		/>
		{#if value}
			<img
				src={value}
				alt={`${label} preview`}
				class="max-h-44 max-w-full rounded-lg object-contain"
			/>
		{:else}
			<div
				class="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:text-foreground"
			>
				<ImagePlus class="size-5" />
			</div>
		{/if}
		<div class="space-y-1">
			<p class="text-sm font-medium">
				{value ? 'Drop an image to replace' : 'Drag and drop an image here'}
			</p>
			<p class="text-xs text-muted-foreground">Images up to 16 MB</p>
		</div>
		<span class={buttonVariants({ size: 'sm' })}>
			{#if uploading}
				<Spinner /> Uploading… {progress}%
			{:else}
				<Upload class="size-3.5" /> {value ? 'Replace image' : 'Pick an image'}
			{/if}
		</span>
		{#if uploading}
			<div class="absolute inset-x-0 bottom-0 h-1 bg-muted">
				<div
					class="h-full bg-primary transition-all duration-200 motion-reduce:transition-none"
					style:width={`${progress}%`}
				></div>
			</div>
		{/if}
	</label>
	<p class="text-xs text-muted-foreground" aria-live="polite">
		{uploading
			? 'Your image is uploading. Please wait before saving.'
			: 'Uses your project file upload allowance.'}
	</p>
</div>
