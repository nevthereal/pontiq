<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';

	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { deleteSubject, getSubjectsWithProjects, editSubject } from '$lib/remote/projects.remote';
	import { CircleCheck, Pencil, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import Input from '$lib/components/ui/input/input.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import Muted from '$lib/components/Muted.svelte';
	import { resolve } from '$app/paths';
</script>

<main class="px-6">
	<h1 class="mb-4 text-3xl font-bold">Subjects</h1>
	<section>
		<h2 class="mb-2 text-lg font-medium">Other subjects</h2>
		<svelte:boundary>
			{#snippet pending()}
				<Loading thing="subjects and projects" />
			{/snippet}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				{#each await getSubjectsWithProjects() as sub (sub.id)}
					<div class="rounded-lg border p-4">
						<div class="flex items-center justify-between gap-2">
							<h2 class="text-xl font-semibold">
								{sub.title}
								{#if sub.pinned}
									<span>(pinned)</span>
								{/if}:
							</h2>
							<div class="flex items-center gap-2">
								<Dialog.Root>
									<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}
										><Pencil /> Edit</Dialog.Trigger
									>
									<Dialog.Content>
										<Dialog.Header>
											<Dialog.Title>Edit subject</Dialog.Title>
											<Dialog.Description>
												<form
													{...editSubject.for(sub.id).enhance(async ({ submit, data }) => {
														toast.promise(
															submit().updates(
																getSubjectsWithProjects().withOverride((subs) =>
																	subs.map((s) =>
																		s.id === sub.id ? { ...s, title: data.title } : s
																	)
																)
															),
															{
																loading: 'Renaming...',
																error: 'Rename failed',
																success: `Successfully renamed ${data.title}`
															}
														);
													})}
												>
													<Field.Set>
														<Field.Group>
															<Field.Field>
																<Field.Label for="title">Subject name</Field.Label>
																<Input id="title" name="title" placeholder="eg. Redox Chemistry" />
																{#if editSubject.fields.title.issues()}
																	{#each editSubject.fields.title.issues() as issue, idx (idx)}
																		<Field.Error>{issue.message}</Field.Error>
																	{/each}
																{/if}
															</Field.Field>
														</Field.Group>
														<Field.Field>
															<Button type="submit"><CircleCheck /> Edit</Button>
														</Field.Field>
													</Field.Set>
												</form>
											</Dialog.Description>
										</Dialog.Header>
									</Dialog.Content>
								</Dialog.Root>
								<AlertDialog.Root>
									<AlertDialog.Trigger
										class={buttonVariants({ variant: 'destructive', size: 'icon-sm' })}
										><Trash2 /></AlertDialog.Trigger
									>
									<AlertDialog.Content>
										<AlertDialog.Header>
											<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
											<AlertDialog.Description
												>This action cannot be undone. Your subject and all of it's projects and the
												project's files will be deleted permanently.</AlertDialog.Description
											>
										</AlertDialog.Header>
										<AlertDialog.Footer>
											<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
											<AlertDialog.Action
												class={buttonVariants({ variant: 'destructive' })}
												onclick={() =>
													toast.promise(deleteSubject(sub.id).updates(getSubjectsWithProjects()), {
														loading: 'Deleting subject…',
														success: 'Deletion sucessful',
														error: 'An error occured during deletion'
													})}>Continue</AlertDialog.Action
											>
										</AlertDialog.Footer>
									</AlertDialog.Content>
								</AlertDialog.Root>
							</div>
						</div>
						<ul class="list-inside list-disc">
							{#each sub.projects as proj (proj.id)}
								<li>
									<a href={resolve('/(protected)/projects/[project_id]', { project_id: proj.id })}>
										{proj.name}
									</a>
								</li>
							{:else}
								<Muted>No projects in subject</Muted>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</svelte:boundary>
	</section>
</main>
