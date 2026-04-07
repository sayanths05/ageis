<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { getPasswordById } from '$lib/db';
	import type { PasswordEntry } from '$lib/types';
	import PasswordForm from '$lib/components/PasswordForm.svelte';
    import { resolve } from '$app/paths';

	let entry = $state<PasswordEntry | null>(null);
	let loading = $state(true);

	onMount(async () => {
		const id = $page.params.id!;
		entry = await getPasswordById(id);

		if (!entry) {
			goto(resolve('/passwords'));
			return;
		}

		loading = false;
	});
</script>

{#if loading}
	<div class="flex items-center justify-center py-24">
		<div class="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else if entry}
	<div in:fly={{ x: 30, duration: 200 }}>
		<PasswordForm {entry} onclose={() => goto(resolve(`/passwords/${$page.params.id}`))} />
	</div>
{/if}
