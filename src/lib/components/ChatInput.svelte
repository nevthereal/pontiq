<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ArrowUpIcon, GraduationCap, Plus, Trash2 } from '@lucide/svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';

	import { attachments, chatConfig } from '$lib/chat.svelte';

	import { Chat } from '@ai-sdk/svelte';
	import Spinner from './ui/spinner/spinner.svelte';
	import Toggle from './ui/toggle/toggle.svelte';
	import type { MyUIMessage } from '$lib/server/ai';
	import { buttonVariants } from './ui/button';
	import { getFiles } from '$lib/remote/files.remote';

	let { chat, projectId }: { chat: Chat<MyUIMessage>; projectId: string } = $props();

	let input = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		chat.sendMessage(
			{
				text: input,
				files: attachments.files.map((a) => ({
					mediaType: a.type,
					type: 'file',
					url: a.utURL,
					filename: a.name
				}))
			},
			{ body: { config: chatConfig.current } }
		);
		input = '';
		attachments.clear();
	}
</script>

<form onsubmit={handleSubmit} class="absolute bottom-0 w-full backdrop-blur-sm">
	<InputGroup.Root>
		<InputGroup.Input bind:value={input} placeholder="Ask, Search or Chat..." />

		<InputGroup.Addon align="block-start">
			{#each attachments.files as att (att.id)}
				<ButtonGroup.Root class="w-48">
					<ButtonGroup.Text
						class="no-scrollbar min-w-0 overflow-x-auto font-mono whitespace-nowrap"
					>
						{att.name}
					</ButtonGroup.Text>
					<InputGroup.Button
						variant="destructive"
						size="icon-xs"
						onclick={() => attachments.remove(att.id)}><Trash2 /></InputGroup.Button
					>
				</ButtonGroup.Root>
			{:else}
				<InputGroup.Text>No files in Chat</InputGroup.Text>
			{/each}
		</InputGroup.Addon>

		<InputGroup.Addon align="block-end">
			<Toggle bind:pressed={chatConfig.current.studyModeEnabled} variant="outline" size="sm"
				><GraduationCap />Enhanced mode</Toggle
			>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={buttonVariants({ size: 'icon-sm', variant: 'outline' })}
					><Plus /></DropdownMenu.Trigger
				>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Label>Select files to add to chat</DropdownMenu.Label>
						<DropdownMenu.Separator />
						{#each await getFiles(projectId) as file (file.id)}
							<DropdownMenu.CheckboxItem
								closeOnSelect={false}
								bind:checked={
									() => attachments.isInChat(file),
									(checked) => {
										if (checked) {
											attachments.add(file);
										} else {
											attachments.remove(file.id);
										}
									}
								}>{file.name}</DropdownMenu.CheckboxItem
							>
						{:else}
							<DropdownMenu.Item disabled>No files in knowledge base</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<InputGroup.Button
				variant="default"
				class="ml-auto rounded-full"
				size="icon-xs"
				disabled={!input}
			>
				{#if chat.status === 'ready'}
					<ArrowUpIcon />
					<span class="sr-only">Send</span>
				{:else}
					<Spinner />
				{/if}
			</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>
</form>
