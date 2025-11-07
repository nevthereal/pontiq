<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import { getUser } from '$lib/remote/auth.remote';

	let { children } = $props();

	const user = $derived(await getUser());
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
	<link rel="stylesheet" href="https://use.typekit.net/lab1nsl.css" />
	<title>Pontiq</title>
</svelte:head>

<Toaster />

<ModeWatcher defaultMode="dark" />
{#if !user}
	<nav class="flex h-[10dvh] items-center justify-between px-4">
		<a href="/" class="font-cooper flex text-3xl font-black tracking-tighter">pontiq (⍺)</a>

		<Button href="/auth">Sign in</Button>
	</nav>
	{@render children?.()}
{:else}
	<Sidebar.Provider>
		<AppSidebar />
		<main class="h-full w-full">
			{@render children?.()}
		</main>
	</Sidebar.Provider>
{/if}
