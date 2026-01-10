<script lang="ts">
	import Logo from '$lib/assets/favicon.png';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve } from '$app/paths';
	import UserDropdown from './UserDropdown.svelte';
	import { DatabaseZap, Files, Folders, Settings, type IconProps } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import type { ResolvedPathname } from '$app/types';

	type Route = {
		name: string;
		icon: Component<IconProps>;
		url: ResolvedPathname;
	};

	const mainItems: Route[] = [
		{
			name: 'Projects',
			icon: DatabaseZap,
			url: resolve('/(protected)/projects')
		},
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

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem></Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
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
		</Sidebar.Group>
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
