<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve } from '$app/paths';
	import UserDropdown from './UserDropdown.svelte';
	import { Files, Folders, Settings, type IconProps } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import type { ResolvedPathname } from '$app/types';

	type Route = {
		name: string;
		icon: Component<IconProps>;
		url: ResolvedPathname;
	};

	const mainItems: Route[] = [
		{
			name: 'Subjects',
			icon: Folders,
			url: resolve('/(protected)/explorer')
		},
		{
			name: 'Files',
			icon: Files,
			url: resolve('/(protected)/files')
		}
	];

	const footerItems: Route[] = [
		{
			name: 'Settings',
			icon: Settings,
			url: resolve('/')
		}
	];
</script>

<Sidebar.Root variant="floating">
	<Sidebar.Header class="px-4">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a
							href="/"
							{...props}
							class="flex items-center justify-center gap-2 p-2 font-cooper text-3xl font-black tracking-tighter"
						>
							pontiq (⍺)</a
						>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content class="px-2">
		<Sidebar.GroupContent>
			<Sidebar.Menu>
				{#each mainItems as i, idx (idx)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a class="font-medium" {...props} href={i.url}> <i.icon />{i.name}</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.GroupContent>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			{#each footerItems as i, idx (idx)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a class="font-medium" {...props} href={i.url}> <i.icon />{i.name}</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
			<Sidebar.MenuItem>
				<UserDropdown />
			</Sidebar.MenuItem></Sidebar.Menu
		>
	</Sidebar.Footer>
</Sidebar.Root>
