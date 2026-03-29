<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, Settings2 } from '@lucide/svelte';
	import ToolHeading from '$lib/components/typography/ToolHeading.svelte';
	import Loading from '$lib/components/typography/Loading.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import StudyPlanEditorForm from '$lib/components/study-plan/StudyPlanEditorForm.svelte';
	import StudyPlanManagerList from '$lib/components/study-plan/StudyPlanManagerList.svelte';
	import { deleteAllStudySteps, deleteStudyStep, getStudySteps } from '$lib/remote/tools.remote';
	import type { StudyPlanStep } from '$lib/server/db/schema';

	let { params } = $props();

	const studyStepsQuery = $derived(getStudySteps(params.project_id));
	const studyStepsResult = $derived(await studyStepsQuery);

	let search = $state('');
	let steps = $state<StudyPlanStep[]>([]);
	let selectedId = $state<string | null>(null);
	let isCreating = $state(false);

	const pendingDeletes = new Map<
		string,
		{
			step: StudyPlanStep;
			index: number;
			timer: ReturnType<typeof setTimeout>;
			toastId: string | number;
		}
	>();

	const filteredSteps = $derived(
		steps.filter((step) => {
			const query = search.trim().toLowerCase();
			if (!query.length) return true;

			return (
				step.title.toLowerCase().includes(query) || step.description.toLowerCase().includes(query)
			);
		})
	);

	const selectedStep = $derived(steps.find((step) => step.id === selectedId) ?? null);
	const preferredStepId = $derived(page.url.searchParams.get('step'));

	function sortSteps(nextSteps: StudyPlanStep[]) {
		return [...nextSteps].sort((left, right) => {
			if (left.date.getTime() !== right.date.getTime()) {
				return left.date.getTime() - right.date.getTime();
			}

			if (left.createdAt.getTime() !== right.createdAt.getTime()) {
				return left.createdAt.getTime() - right.createdAt.getTime();
			}

			return left.id.localeCompare(right.id);
		});
	}

	$effect(() => {
		const nextSteps = sortSteps(
			(studyStepsResult ?? []).filter((step) => !pendingDeletes.has(step.id))
		);
		steps = nextSteps;

		if (selectedId && nextSteps.some((step) => step.id === selectedId)) return;
		if (isCreating) return;

		const preferredStep = preferredStepId
			? nextSteps.find((step) => step.id === preferredStepId)
			: null;

		selectedId = preferredStep?.id ?? nextSteps[0]?.id ?? null;
		isCreating = selectedId == null;
	});

	function selectStep(id: string) {
		selectedId = id;
		isCreating = false;
	}

	function openCreateForm() {
		selectedId = null;
		isCreating = true;
	}

	function handleCreated(step: StudyPlanStep) {
		steps = sortSteps([...steps, step]);
		selectedId = step.id;
		isCreating = false;
	}

	function handleUpdated(updatedStep: StudyPlanStep) {
		steps = sortSteps(steps.map((step) => (step.id === updatedStep.id ? updatedStep : step)));
		selectedId = updatedStep.id;
		isCreating = false;
	}

	function restoreStep(step: StudyPlanStep, index: number) {
		const nextSteps = [...steps];
		nextSteps.splice(Math.min(index, nextSteps.length), 0, step);
		steps = sortSteps(nextSteps);

		if (!selectedId || isCreating) {
			selectedId = step.id;
			isCreating = false;
		}
	}

	function selectNeighborAfterDelete(currentId: string) {
		const currentIndex = steps.findIndex((step) => step.id === currentId);
		const nextStep = steps[currentIndex + 1] ?? steps[currentIndex - 1] ?? null;

		if (nextStep) {
			selectedId = nextStep.id;
			isCreating = false;
			return;
		}

		selectedId = null;
		isCreating = true;
	}

	function undoDelete(id: string) {
		const pendingDelete = pendingDeletes.get(id);
		if (!pendingDelete) return;

		clearTimeout(pendingDelete.timer);
		pendingDeletes.delete(id);
		toast.dismiss(pendingDelete.toastId);
		restoreStep(pendingDelete.step, pendingDelete.index);
	}

	function queueDelete(step: StudyPlanStep) {
		const index = steps.findIndex((entry) => entry.id === step.id);
		if (index < 0) return;

		steps = steps.filter((entry) => entry.id !== step.id);

		if (selectedId === step.id) {
			selectNeighborAfterDelete(step.id);
		}

		const toastId = toast.message('Study step scheduled for deletion', {
			description: 'Undo within 5 seconds to keep it.',
			duration: 5000,
			action: {
				label: 'Undo',
				onClick: () => undoDelete(step.id)
			}
		});

		const timer = setTimeout(async () => {
			pendingDeletes.delete(step.id);

			try {
				await deleteStudyStep({ id: step.id, projectId: params.project_id });
			} catch (deleteError) {
				console.error(deleteError);
				restoreStep(step, index);
				toast.error('Failed to delete study step');
			}
		}, 5000);

		pendingDeletes.set(step.id, { step, index, timer, toastId });
	}

	async function handleDeleteAll() {
		await toast.promise(deleteAllStudySteps(params.project_id), {
			loading: 'Deleting study plan…',
			success: 'Study plan deleted',
			error: 'Failed to delete study plan'
		});

		for (const pendingDelete of pendingDeletes.values()) {
			clearTimeout(pendingDelete.timer);
		}

		pendingDeletes.clear();
		steps = [];
		selectedId = null;
		isCreating = true;
	}
</script>

<div class="space-y-4 lg:flex lg:min-h-0 lg:flex-col">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<ToolHeading>
				<Settings2 /> Manage Study Plan
			</ToolHeading>
			<p class="text-sm text-muted-foreground">
				Create, edit, and remove dated study steps while keeping the overview page read-only.
			</p>
		</div>
		<a
			href={resolve('/(protected)/projects/[project_id]/study-plan', params)}
			class={buttonVariants({ variant: 'outline' })}
		>
			<ArrowLeft />
			Back To Overview
		</a>
	</div>

	<svelte:boundary>
		{#snippet pending()}
			<Loading thing="study plan" />
		{/snippet}

		<div
			class="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:overflow-hidden"
		>
			<StudyPlanManagerList
				steps={filteredSteps}
				{selectedId}
				{search}
				onSearchChange={(value) => (search = value)}
				onSelect={selectStep}
				onCreateNew={openCreateForm}
				onDelete={queueDelete}
				onDeleteAll={handleDeleteAll}
			/>
			<StudyPlanEditorForm
				projectId={params.project_id}
				{selectedStep}
				onCreated={handleCreated}
				onUpdated={handleUpdated}
			/>
		</div>
	</svelte:boundary>
</div>
