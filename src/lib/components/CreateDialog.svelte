<script>
	import * as Select from '$lib/components/ui/select/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Plus } from '@lucide/svelte';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { createProject, createSubject, getSubjects } from '$lib/remote/projects.remote';

	let open = $state(false);

	let value = $state('');
</script>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ size: 'sm' })}><Plus />Create project</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create a project</Dialog.Title>
		</Dialog.Header>
		<form {...createProject}>
			<Field.Group>
				<Field.Set>
					<Field.Field>
						<Field.Label for="name" class="mb-1">Name</Field.Label>
						<Input placeholder="eg. Redox Chemistry" name="name" />
						{#if createProject.fields.name.issues()}
							{#each createProject.fields.name.issues() as i, idx (idx)}
								<Field.Error>{i.message}</Field.Error>
							{/each}
						{/if}
					</Field.Field>
					<Field.Field class="mt-4">
						<Field.Label for="subjectId" class="mb-1">Subject/Class</Field.Label>

						<Select.Root type="single" bind:value name="subjectId">
							<Select.Trigger class="w-full"
								>{(await getSubjects()).find((s) => s.id === value)?.title ??
									'Select a subject'}</Select.Trigger
							>
							<Select.Content>
								{#each await getSubjects() as sub (sub.id)}
									<Select.Item value={sub.id}>{sub.title}</Select.Item>
								{:else}
									<Select.Item value="nope" disabled>No active Subjects. Create one!</Select.Item>
								{/each}
								<Dialog.Root bind:open>
									<Dialog.Trigger
										class={buttonVariants({ size: 'sm', class: 'w-full', variant: 'outline' })}
										>Create subject</Dialog.Trigger
									>
									<Dialog.Content>
										<Dialog.Header>
											<Dialog.Title>New subject</Dialog.Title>
											<Dialog.Description>
												<form
													{...createSubject.enhance(async ({ submit }) => {
														await submit().updates(getSubjects());

														open = false;
													})}
												>
													<Field.Set>
														<Field.Field>
															<Field.Label for="title" class="mb-2">Name</Field.Label>
															<div class="flex gap-2">
																<Input name="title" type="text" />
																<Button type="submit">Add</Button>
															</div>
														</Field.Field>
													</Field.Set>
												</form>
											</Dialog.Description>
										</Dialog.Header>
									</Dialog.Content>
								</Dialog.Root>
							</Select.Content>
						</Select.Root>
						<Field.Description>Use an existing subject or create one</Field.Description>
					</Field.Field>
				</Field.Set>
				<Field.Field orientation="horizontal">
					<Button type="submit" class="mt-2">Create Project</Button>
				</Field.Field>
			</Field.Group>
		</form>
	</Dialog.Content>
</Dialog.Root>
