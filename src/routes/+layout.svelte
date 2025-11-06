<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Logo from '$lib/assets/logo.png';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import { getUser } from '$lib/remote/auth.remote';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
	<title>Pontiq</title>
</svelte:head>

<Toaster />

<ModeWatcher defaultMode="dark" />
{#if await getUser()}
	<nav class="flex h-[10dvh] items-center justify-between px-4">
		<a href="/" class="items-cnter flex text-3xl font-black tracking-tighter"
			><img src={Logo} alt="logo" class="mr-2 h-8" /> pontiq (⍺)</a
		>

		<Button href="/auth">Sign in</Button>
	</nav>
	{@render children?.()}
{:else}
	<Sidebar.Provider>
		<AppSidebar />
		<main class="my-8">
			{@render children?.()}
		</main>
	</Sidebar.Provider>
{/if}
