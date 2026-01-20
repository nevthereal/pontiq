<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import {
		Trash2,
		FolderOpen,
		MessageCircle,
		NotebookPen,
		CreditCard,
		FileText,
		Calendar
	} from '@lucide/svelte';
	import { deleteProject, getProjectDetails } from '$lib/remote/projects.remote';
	import { resolve } from '$app/paths';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Muted from '$lib/components/typography/Muted.svelte';
	import Loading from '$lib/components/typography/Loading.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	let { params } = $props();

	const projectDetails = $derived(await getProjectDetails(params.project_id));

	function formatDate(date: Date | null) {
		if (!date) return 'Unknown';
		return new Intl.DateTimeFormat('en-GB', {
			dateStyle: 'long'
		}).format(date);
	}
</script>

<svelte:boundary>
	{#snippet pending()}
		<Loading thing="project" />
	{/snippet}
	{#snippet failed()}
		<p class="text-destructive">Failed to load project</p>
	{/snippet}

	<div class="flex flex-col gap-6">
		<header>
			<ToolHeading>
				<FolderOpen />
				{projectDetails.name}
			</ToolHeading>
			{#if projectDetails.subject}
				<Muted class="mt-1">
					{projectDetails.subject.title} &middot; Created {formatDate(projectDetails.createdAt)}
				</Muted>
			{:else}
				<Muted class="mt-1">In no subject</Muted>
			{/if}
		</header>

		<Separator />

		<!-- Stats Grid -->
		<section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<a
				href={resolve('/(protected)/projects/[project_id]/files', params)}
				class="group flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:bg-muted/50"
			>
				<div class="flex items-center gap-2 text-muted-foreground">
					<FileText class="h-4 w-4" />
					<span class="text-sm font-medium">Files</span>
				</div>
				<span class="text-3xl font-bold">{projectDetails.fileCount}</span>
				<Muted>in knowledge base</Muted>
			</a>

			<a
				href={resolve('/(protected)/projects/[project_id]/study-plan', params)}
				class="group flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:bg-muted/50"
			>
				<div class="flex items-center gap-2 text-muted-foreground">
					<Calendar class="h-4 w-4" />
					<span class="text-sm font-medium">Study Steps</span>
				</div>
				<span class="text-3xl font-bold">{projectDetails.studyStepCount}</span>
				<Muted>planned activities</Muted>
			</a>

			<a
				href={resolve('/(protected)/projects/[project_id]/flashcards', params)}
				class="group flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:bg-muted/50"
			>
				<div class="flex items-center gap-2 text-muted-foreground">
					<CreditCard class="h-4 w-4" />
					<span class="text-sm font-medium">Flashcards</span>
				</div>
				<span class="text-3xl font-bold">{projectDetails.flashcardCount}</span>
				<Muted>for review</Muted>
			</a>

			<a
				href={resolve('/(protected)/projects/[project_id]/chat', params)}
				class="group flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:bg-muted/50"
			>
				<div class="flex items-center gap-2 text-muted-foreground">
					<MessageCircle class="h-4 w-4" />
					<span class="text-sm font-medium">Chat</span>
				</div>
				<span class="text-3xl font-bold">AI</span>
				<Muted>powered assistant</Muted>
			</a>
		</section>

		<!-- Upcoming Study Steps -->
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Upcoming Study Steps</h2>
				{#if projectDetails.studyStepCount > 0}
					<a
						href={resolve('/(protected)/projects/[project_id]/study-plan', params)}
						class="text-sm text-muted-foreground hover:underline"
					>
						View all
					</a>
				{/if}
			</div>
			{#if projectDetails.upcomingSteps.length > 0}
				<Item.Group class="space-y-2">
					{#each projectDetails.upcomingSteps as step (step.id)}
						<Item.Root variant="outline" class="flex-col items-start gap-1">
							<Item.Content class="w-full">
								<div class="flex items-center justify-between">
									<Item.Title>{step.title}</Item.Title>
									<Badge variant="secondary">
										{step.type}
									</Badge>
								</div>
								<Item.Description class="flex items-center gap-1">
									<Calendar class="h-3 w-3" />
									{formatDate(step.date)}
								</Item.Description>
							</Item.Content>
						</Item.Root>
					{/each}
				</Item.Group>
			{:else}
				<div class="rounded-xl border border-dashed p-6 text-center">
					<NotebookPen class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">
						{#if projectDetails.studyStepCount === 0}
							No study plan yet. Ask the AI in chat to generate one for you.
						{:else}
							No upcoming steps. All your study steps are in the past.
						{/if}
					</p>
				</div>
			{/if}
		</section>

		<!-- Quick Actions -->
		<section>
			<h2 class="mb-3 text-lg font-semibold">Quick Actions</h2>
			<Item.Group class="space-y-2">
				<Item.Root variant="outline">
					{#snippet child({ props })}
						<a
							href={resolve('/(protected)/projects/[project_id]/chat', params)}
							{...props}
							class="flex items-center gap-3"
						>
							<Item.Media variant="icon">
								<MessageCircle />
							</Item.Media>
							<Item.Content>
								<Item.Title>Start a Chat</Item.Title>
								<Item.Description>Ask questions about your study materials</Item.Description>
							</Item.Content>
						</a>
					{/snippet}
				</Item.Root>

				<Item.Root variant="outline">
					{#snippet child({ props })}
						<a
							href={resolve('/(protected)/projects/[project_id]/files', params)}
							{...props}
							class="flex items-center gap-3"
						>
							<Item.Media variant="icon">
								<FileText />
							</Item.Media>
							<Item.Content>
								<Item.Title>Upload Files</Item.Title>
								<Item.Description>Add documents to your knowledge base</Item.Description>
							</Item.Content>
						</a>
					{/snippet}
				</Item.Root>

				{#if projectDetails.studyStepCount === 0}
					<Item.Root variant="outline">
						{#snippet child({ props })}
							<a
								href={resolve('/(protected)/projects/[project_id]/chat', params)}
								{...props}
								class="flex items-center gap-3"
							>
								<Item.Media variant="icon">
									<NotebookPen />
								</Item.Media>
								<Item.Content>
									<Item.Title>Generate Study Plan</Item.Title>
									<Item.Description>Ask the AI to create a study plan for you</Item.Description>
								</Item.Content>
							</a>
						{/snippet}
					</Item.Root>
				{/if}
			</Item.Group>
		</section>

		<Separator />

		<!-- Danger Zone -->
		<section>
			<h2 class="mb-3 text-lg font-semibold text-destructive">Danger Zone</h2>
			<AlertDialog.Root>
				<AlertDialog.Trigger class={buttonVariants({ size: 'sm', variant: 'destructive' })}>
					<Trash2 /> Delete Project
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action cannot be undone. This will permanently delete this project, all of its
							files, threads and tool results.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action
							onclick={() =>
								toast.promise(
									deleteProject(params.project_id).then(() => goto(resolve('/'))),
									{
										loading: 'Deleting project...',
										success: 'Project deleted',
										error: 'An error occurred during deletion'
									}
								)}
							class={buttonVariants({ variant: 'destructive' })}>Delete</AlertDialog.Action
						>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</section>
	</div>
</svelte:boundary>
