<script>
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { DoorOpen } from '@lucide/svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let loading = $state(false);
</script>

<Button
	size="lg"
	onclick={async () => {
		loading = true;
		await authClient.signIn.social({
			provider: 'google'
		});
	}}
	>{#if loading}
		<Spinner />
	{:else}
		<DoorOpen />
	{/if} Sign in with Google</Button
>
