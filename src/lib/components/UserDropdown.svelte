<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { authClient } from '$lib/auth-client';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { LogOut, MoonIcon, SunIcon } from '@lucide/svelte';
	import { toggleMode, mode } from 'mode-watcher';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getUser } from '$lib/remote/auth.remote';

	const sidebar = Sidebar.useSidebar();
	const user = $derived(await getUser());
</script>

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
						<Avatar.Fallback class="rounded-lg uppercase">{user.name.slice(0, 2)}</Avatar.Fallback>
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
					onclick={async () => await authClient.signOut().then(() => location.reload())}
					><LogOut /> Sign out</DropdownMenu.Item
				>
				<DropdownMenu.Item closeOnSelect={false} onclick={toggleMode}>
					{#if mode.current === 'dark'}
						<MoonIcon />
					{:else}
						<SunIcon />
					{/if}

					Change theme</DropdownMenu.Item
				>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
