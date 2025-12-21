<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import Logo from '$lib/assets/favicon.png';
	import { getUser } from '$lib/remote/auth.remote';
	import { dev } from '$app/environment';

	let { children } = $props();

	const user = $derived(await getUser());
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
	<link rel="stylesheet" href="https://use.typekit.net/lab1nsl.css" />
	<title>Pontiq</title>
</svelte:head>

<Toaster />

{#if dev}
	<div class="fixed right-4 bottom-4 z-10 rounded-lg bg-red-500 p-2">Dev mode</div>
{/if}

<ModeWatcher defaultMode="dark" />
{#if !user}
	<nav class="flex h-[10dvh] items-center justify-between px-4">
		<a href="/" class="flex items-center gap-2 font-cooper text-3xl font-black tracking-tighter"
			><img class="size-8" src={Logo} alt="pontiq logo" /> pontiq (⍺)</a
		>

		<Button href="/auth">Sign in</Button>
	</nav>
	{@render children?.()}
{:else}
	<Sidebar.Provider>
		<AppSidebar />

		<Sidebar.Inset>
			{#if user.isApproved}
				<main class="px-4">
					{@render children?.()}
				</main>
			{:else}
				<p class="mt-8 text-center font-mono">Your account is not approved. Please request.</p>
			{/if}
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
