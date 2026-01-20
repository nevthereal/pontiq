<script lang="ts">
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { mode, ModeWatcher, toggleMode } from 'mode-watcher';
	import '../app.css';
	import Logo from '$lib/assets/favicon.png';
	import { getUser } from '$lib/remote/auth.remote';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Check, ChevronsUpDown, LogOut, MoonIcon, Slash, SunIcon } from '@lucide/svelte';
	import { authClient } from '$lib/auth-client';
	import { resolve } from '$app/paths';
	import { getProject, getSubjectsWithProjects } from '$lib/remote/projects.remote';
	import { page } from '$app/state';

	let { children, params } = $props();

	const user = $derived(await getUser());
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
	<link rel="stylesheet" href="https://use.typekit.net/lab1nsl.css" />
	<title>Pontiq</title>
</svelte:head>

<Toaster />
<ModeWatcher defaultMode="dark" />

<div class="flex h-screen flex-col">
	<nav class="mb-2 flex items-center justify-between rounded-b-lg border-b p-4">
		<div class="flex items-end gap-4">
			<a href="/" class="contents font-cooper text-3xl font-black tracking-tighter"
				><img class="size-8" src={Logo} alt="pontiq logo" /> pontiq (⍺)</a
			>
			{#if params.project_id}
				<p class="my-auto text-lg font-bold text-muted-foreground">/</p>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger title="Switch project" class={buttonVariants({ variant: 'ghost' })}
						>{(await getProject(params.project_id)).name} <ChevronsUpDown />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="start" class="w-48">
						<DropdownMenu.Group>
							<DropdownMenu.Label>Switch project</DropdownMenu.Label>
							<DropdownMenu.Separator />
							{#each await getSubjectsWithProjects() as sub (sub.id)}
								<DropdownMenu.Label>{sub.title}</DropdownMenu.Label>
								{#each sub.projects as project (project.id)}
									<a
										href={resolve('/(protected)/projects/[project_id]', { project_id: project.id })}
										><DropdownMenu.Item
											>{project.name}
											{#if params.project_id === project.id}
												<Check />
											{/if}
										</DropdownMenu.Item></a
									>
								{/each}
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>
		{#if !user}
			<Button href="/auth">Sign in</Button>
		{:else}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="flex gap-2">
					<Avatar.Root class="size-8 rounded-lg grayscale">
						<Avatar.Image src={user.image} alt={user.name} />
						<Avatar.Fallback class="rounded-lg uppercase">{user.name.slice(0, 2)}</Avatar.Fallback>
					</Avatar.Root>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-medium">{user.name}</span>
						<span class="truncate text-xs text-muted-foreground">
							{user.email}
						</span>
					</div>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" side="bottom">
					<DropdownMenu.Group>
						<DropdownMenu.Label>Profile</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item closeOnSelect={false} onclick={toggleMode}>
							{#if mode.current === 'dark'}
								<MoonIcon />
							{:else}
								<SunIcon />
							{/if}
							Change theme</DropdownMenu.Item
						>
						<DropdownMenu.Item
							variant="destructive"
							onclick={async () => await authClient.signOut().then(() => location.reload())}
							><LogOut /> Sign out</DropdownMenu.Item
						>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
	</nav>

	<main class="flex-1 overflow-hidden p-4">
		{#if !user}
			{@render children()}
		{:else}
			<div class="contents">
				{#if user.isApproved}
					{@render children?.()}
				{:else}
					<p class="mt-8 text-center font-mono">Your account is not approved. Please request.</p>
				{/if}
			</div>
		{/if}
	</main>
</div>
