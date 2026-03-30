<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { getStudySteps } from '$lib/remote/tools.remote';
	import Loading from '$lib/components/typography/Loading.svelte';
	import Muted from '$lib/components/typography/Muted.svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import {
		CalendarDays,
		ChevronDown,
		Clock,
		History,
		Maximize2,
		NotebookPen,
		Settings2
	} from '@lucide/svelte';

	let { params } = $props();

	const studySteps = $derived(await getStudySteps(params.project_id));
	const upcomingSteps = $derived.by(() => {
		if (!studySteps?.length) return [];

		const today = startOfDay(new Date()).getTime();
		return studySteps.filter((step) => startOfDay(step.date).getTime() >= today);
	});
	const pastSteps = $derived.by(() => {
		if (!studySteps?.length) return [];

		const today = startOfDay(new Date()).getTime();
		return [...studySteps.filter((step) => startOfDay(step.date).getTime() < today)].reverse();
	});
	const nextStudyStep = $derived(upcomingSteps[0] ?? null);

	function startOfDay(date: Date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	}

	function formatDate(date: Date) {
		return Intl.DateTimeFormat('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(date);
	}

	function getRelativeDateLabel(date: Date) {
		const offset = Math.round(
			(startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86_400_000
		);

		if (offset === 0) return 'Today';
		if (offset === 1) return 'Tomorrow';
		if (offset > 1) return `In ${offset} days`;
		if (offset === -1) return 'Yesterday';
		return `${Math.abs(offset)} days ago`;
	}
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<ToolHeading>
				<NotebookPen /> Study Plan
			</ToolHeading>
		</div>
		<a
			href={resolve('/(protected)/projects/[project_id]/study-plan/manage', params)}
			class={buttonVariants({ variant: 'outline' })}
		>
			<Settings2 />
			Manage Study Plan
		</a>
	</div>

	<div class="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
		<svelte:boundary>
			{#snippet pending()}
				<Loading thing="study plan" />
			{/snippet}

			{#if studySteps?.length}
				<div class="space-y-4 pb-4">
					{#if nextStudyStep}
						<section class="overflow-hidden rounded-3xl border bg-card">
							<div
								class="border-b bg-gradient-to-r from-muted/80 via-muted/40 to-transparent px-6 py-4"
							>
								<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
									<Clock class="size-4" />
									<span>Next study step</span>
								</div>
							</div>
							<div class="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.6fr)_16rem]">
								<div class="space-y-4">
									<div class="flex flex-wrap items-center gap-2">
										<Badge>{getRelativeDateLabel(nextStudyStep.date)}</Badge>
										<Badge variant="secondary">{nextStudyStep.type}</Badge>
									</div>
									<div class="space-y-2">
										<h2 class="text-3xl font-semibold tracking-tight">{nextStudyStep.title}</h2>
										<p class="max-w-2xl text-sm leading-6 text-muted-foreground">
											{nextStudyStep.description}
										</p>
									</div>
								</div>
							</div>
						</section>
					{:else}
						<section class="rounded-3xl border bg-card px-6 py-6">
							<div class="flex flex-wrap items-start justify-between gap-4">
								<div class="space-y-2">
									<p class="text-sm font-medium text-muted-foreground">Next study step</p>
									<h2 class="text-2xl font-semibold tracking-tight">No upcoming steps scheduled</h2>
									<p class="text-sm text-muted-foreground">
										All current study steps are in the past. Add another step to continue the plan.
									</p>
								</div>
								<Badge variant="secondary">Up to date</Badge>
							</div>
						</section>
					{/if}

					<div class="space-y-3">
						<Collapsible.Root open={true}>
							<section class="overflow-hidden rounded-2xl border bg-card">
								<Collapsible.Trigger
									class="group flex w-full items-center justify-between px-5 py-4 text-left"
								>
									<div class="flex items-center gap-3">
										<div class="rounded-xl border bg-muted/40 p-2 text-muted-foreground">
											<CalendarDays class="size-4" />
										</div>
										<div>
											<h3 class="font-semibold">Upcoming</h3>
											<p class="text-sm text-muted-foreground">
												{upcomingSteps.length}
												{upcomingSteps.length === 1 ? 'step' : 'steps'} planned
											</p>
										</div>
									</div>
									<ChevronDown
										class="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
									/>
								</Collapsible.Trigger>
								<Collapsible.Content>
									<div class="border-t px-4 py-4">
										{#if upcomingSteps.length}
											<ul class="space-y-3">
												{#each upcomingSteps as step (step.id)}
													<li class="rounded-2xl border bg-background/70 p-4">
														<div class="flex flex-wrap items-start justify-between gap-3">
															<div class="space-y-2">
																<div class="flex flex-wrap items-center gap-2">
																	<h4 class="font-semibold">{step.title}</h4>
																	{#if nextStudyStep?.id === step.id}
																		<Badge>Next</Badge>
																	{/if}
																	<Badge variant="secondary">{step.type}</Badge>
																</div>
																<p class="text-sm text-muted-foreground">{step.description}</p>
															</div>
															<div class="flex items-center gap-2">
																<Badge variant="outline">{getRelativeDateLabel(step.date)}</Badge>
															</div>
														</div>
														<p class="mt-3 text-sm text-muted-foreground">
															{formatDate(step.date)}
														</p>
													</li>
												{/each}
											</ul>
										{:else}
											<div
												class="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground"
											>
												No upcoming study steps.
											</div>
										{/if}
									</div>
								</Collapsible.Content>
							</section>
						</Collapsible.Root>

						<Collapsible.Root open={false}>
							<section class="overflow-hidden rounded-2xl border bg-card">
								<Collapsible.Trigger
									class="group flex w-full items-center justify-between px-5 py-4 text-left"
								>
									<div class="flex items-center gap-3">
										<div class="rounded-xl border bg-muted/40 p-2 text-muted-foreground">
											<History class="size-4" />
										</div>
										<div>
											<h3 class="font-semibold">Past</h3>
											<p class="text-sm text-muted-foreground">
												{pastSteps.length} completed
											</p>
										</div>
									</div>
									<ChevronDown
										class="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
									/>
								</Collapsible.Trigger>
								<Collapsible.Content>
									<div class="border-t px-4 py-4">
										{#if pastSteps.length}
											<ul class="space-y-3">
												{#each pastSteps as step (step.id)}
													<li class="rounded-2xl border bg-background/70 p-4">
														<div class="flex flex-wrap items-start justify-between gap-3">
															<div class="space-y-2">
																<div class="flex flex-wrap items-center gap-2">
																	<h4 class="font-semibold">{step.title}</h4>
																	<Badge variant="secondary">{step.type}</Badge>
																</div>
																<p class="text-sm text-muted-foreground">{step.description}</p>
															</div>
															<div class="flex items-center gap-2">
																<Badge variant="outline">{getRelativeDateLabel(step.date)}</Badge>
																<Dialog.Root>
																	<Dialog.Trigger
																		class={buttonVariants({ variant: 'outline', size: 'sm' })}
																	>
																		<Maximize2 />Details
																	</Dialog.Trigger>
																	<Dialog.Content>
																		<Dialog.Header>
																			<Dialog.Title>{step.title}</Dialog.Title>
																			<Dialog.Description>{step.description}</Dialog.Description>
																		</Dialog.Header>
																	</Dialog.Content>
																</Dialog.Root>
															</div>
														</div>
														<p class="mt-3 text-sm text-muted-foreground">
															{formatDate(step.date)}
														</p>
													</li>
												{/each}
											</ul>
										{:else}
											<div
												class="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground"
											>
												No past study steps yet.
											</div>
										{/if}
									</div>
								</Collapsible.Content>
							</section>
						</Collapsible.Root>
					</div>
				</div>
			{:else}
				<div class="rounded-2xl border border-dashed p-6">
					<Muted>
						No study plan generated yet. Prompt the chat to generate one or create steps in the
						manager.
					</Muted>
				</div>
			{/if}
		</svelte:boundary>
	</div>
</div>
