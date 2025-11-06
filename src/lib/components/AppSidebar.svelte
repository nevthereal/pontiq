<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve } from '$app/paths';
	import UserDropdown from './UserDropdown.svelte';
	import { Search } from '@lucide/svelte';
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
							class="flex items-center justify-center gap-2 p-2 text-2xl font-black tracking-tighter"
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
				<UserDropdown />
			</Sidebar.MenuItem></Sidebar.Menu
		>
	</Sidebar.Footer>
</Sidebar.Root>
