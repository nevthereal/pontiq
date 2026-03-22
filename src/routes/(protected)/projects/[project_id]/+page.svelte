<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
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
		Calendar as CalendarIcon
	} from '@lucide/svelte';
	import { deleteProject, getProjectDetails } from '$lib/remote/projects.remote';
	import { setProjectExamDate } from '$lib/remote/projects.remote';
	import { resolve } from '$app/paths';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Muted from '$lib/components/typography/Muted.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';

	let { params } = $props();

	const dateFormatter = new DateFormatter('en-GB', {
		day: '2-digit',
		month: 'short'
	});

	let examDateOpen = $state(false);
	let examDateValue = $state<CalendarDate | undefined>(undefined);
	let examDateDialogOpen = $state(false);
	let projectDetails = $derived(await getProjectDetails(params.project_id));

	function formatDate(date: Date | null) {
		if (!date) return 'Unknown';
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: 'short'
		}).format(date);
	}

	function formatCalendarDate(date: CalendarDate | undefined) {
		if (!date) return 'Select date';
		return dateFormatter.format(date.toDate(getLocalTimeZone()));
	}
</script>

<div class="no-scrollbar flex flex-col gap-6 overflow-y-scroll">
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
		<Dialog.Root bind:open={examDateDialogOpen}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<div
						{...props}
						class="group flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors hover:bg-muted/50"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-muted-foreground">
								<CalendarIcon class="h-4 w-4" />
								<span class="text-sm font-medium">Exam Date</span>
							</div>
							<span class="text-xs font-medium text-muted-foreground">
								{projectDetails.examDate ? 'Edit' : 'Set'}
							</span>
						</div>
						<span class="text-3xl font-bold">
							{projectDetails.examDate ? formatDate(projectDetails.examDate) : 'Not set'}
						</span>
						<Muted>
							{projectDetails.examDate
								? 'Click to update your target date'
								: 'Set a target date to guide your review cadence'}
						</Muted>
					</div>
				{/snippet}
			</Dialog.Trigger>

			<Dialog.Content class="sm:max-w-110">
				<Dialog.Header>
					<Dialog.Title>Set Exam Date</Dialog.Title>
					<Dialog.Description>
						Choose a date to tighten review intervals as the exam approaches.
					</Dialog.Description>
				</Dialog.Header>
				<form
					{...setProjectExamDate.for(projectDetails.id).enhance(async ({ submit, data }) => {
						const savePromise = submit().updates(getProjectDetails(projectDetails.id));
						toast.promise(savePromise, {
							loading: 'Saving exam date...',
							success: data.examDate?.length ? 'Exam date updated' : 'Exam date cleared',
							error: 'Failed to update exam date'
						});
					})}
				>
					<div class="flex flex-col gap-3 py-3">
						<input
							type="hidden"
							id="{projectDetails.id}-date"
							name="examDate"
							value={examDateValue?.toString() ?? ''}
						/>
						<Popover.Root bind:open={examDateOpen}>
							<Popover.Trigger id="examDate">
								{#snippet child({ props })}
									<Button {...props} variant="outline" class="w-full justify-between font-normal">
										{formatCalendarDate(examDateValue)}
										<CalendarIcon class="h-4 w-4" />
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-auto overflow-hidden p-0" align="start">
								<Calendar
									type="single"
									bind:value={examDateValue}
									captionLayout="dropdown"
									onValueChange={() => {
										examDateOpen = false;
									}}
								/>
							</Popover.Content>
						</Popover.Root>
						{#if setProjectExamDate.fields.examDate.issues()}
							{#each setProjectExamDate.fields.examDate.issues() as issue, idx (idx)}
								<p class="text-sm text-destructive">{issue.message}</p>
							{/each}
						{/if}
					</div>
					<Dialog.Footer class="gap-2">
						<Dialog.Close>
							{#snippet child({ props })}
								<Button {...props} type="button" variant="ghost">Cancel</Button>
							{/snippet}
						</Dialog.Close>
						<Button type="submit">Save</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>

		<a
			href={resolve('/(protected)/projects/[project_id]/study-plan', params)}
			class="group flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:bg-muted/50"
		>
			<div class="flex items-center gap-2 text-muted-foreground">
				<CalendarIcon class="h-4 w-4" />
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
			<span class="text-3xl font-bold"
				>{projectDetails.flashcards.filter((f) => f.rating != 'Easy').length}<span
					class="text-xs text-muted-foreground">/{projectDetails.flashcards.length}</span
				></span
			>
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
								<CalendarIcon class="h-3 w-3" />
								{formatDate(step.date)}
							</Item.Description>
						</Item.Content>
					</Item.Root>
				{/each}
			</Item.Group>
		{:else}
			<Empty.Root class="border border-dashed">
				<Empty.Header>
					<Empty.Media variant="icon">
						<NotebookPen />
					</Empty.Media>
					<Empty.Title>No study steps</Empty.Title>
					<Empty.Description
						>{#if projectDetails.studyStepCount === 0}
							No study plan yet. Ask the AI in chat to generate one for you.
						{:else}
							No upcoming steps. All your study steps are in the past.
						{/if}</Empty.Description
					>
				</Empty.Header>
			</Empty.Root>
		{/if}
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
