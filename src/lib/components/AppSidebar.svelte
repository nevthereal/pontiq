<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Logo from '$lib/assets/logo.png';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import { getUser } from '$lib/remote/auth.remote';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import { resolve } from '$app/paths';
	import { Search } from '@lucide/svelte';

	const sidebar = Sidebar.useSidebar();

	const user = $derived(await getUser());
</script>

<Sidebar.Root variant="floating">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/" {...props} class="items-cnter flex text-3xl font-black tracking-tighter"
							><img src={Logo} alt="logo" class="mr-2 h-8" /> pontiq (⍺)</a
						>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.GroupContent>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a class="font-medium" {...props} href={resolve('/(protected)/explorer')}>
								<Search />Explorer</a
							>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.GroupContent>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				{#if user}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuButton
									{...props}
									size="lg"
									class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Avatar.Root class="size-8 rounded-lg grayscale">
										<Avatar.Image src={user.image} alt={user.name} />
										<Avatar.Fallback class="rounded-lg">{user.name.slice(0, 2)}</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium">{user.name}</span>
										<span class="truncate text-xs text-muted-foreground">
											{user.email}
										</span>
									</div>
								</Sidebar.MenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" side={sidebar.isMobile ? 'bottom' : 'right'}>
							<DropdownMenu.Group>
								<DropdownMenu.Label>Profile</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									variant="destructive"
									onclick={async () => await authClient.signOut().then(() => location.reload())}
									>Sign out</DropdownMenu.Item
								>
								<ModeToggle />
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<Button href="/auth">Sign in</Button>
				{/if}
			</Sidebar.MenuItem></Sidebar.Menu
		>
	</Sidebar.Footer>
</Sidebar.Root>
<!-- <nav class="flex h-[10dvh] items-center justify-between px-4">
	<div class="mr-4 flex items-center gap-2">
		<div class="mr-4">
			{#if await getUser()}
			{/if}
		</div>
		<svelte:boundary>
			{#snippet pending()}
				<p>loading user</p>
			{/snippet}
			{#snippet failed()}
				<p>failed to load user</p>
			{/snippet}
			{@const user = await getUser()}

		</svelte:boundary>
	</div>
</nav> -->
