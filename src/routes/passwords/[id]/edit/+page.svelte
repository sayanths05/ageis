<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { getPasswordById } from '$lib/db';
	import type { PasswordEntry } from '$lib/types';
	import PasswordForm from '$lib/components/PasswordForm.svelte';
    import { resolve } from '$app/paths';

	let entry = $state<PasswordEntry | null>(null);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const id = page.params.id!;
			entry = await getPasswordById(id);

			if (!entry) {
				goto(resolve('/passwords'));
				return;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load password.';
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="flex items-center justify-center py-24">
		<div class="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else if error}
	<div class="max-w-lg mx-auto px-6 py-10">
		<div class="py-3 px-4 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">
			{error}
		</div>
	</div>
{:else if entry}
	<div in:fly={{ x: 30, duration: 200 }}>
		<PasswordForm {entry} onclose={() => goto(resolve(`/passwords/${page.params.id}`))} />
	</div>
{/if}
