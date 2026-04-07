<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { getPasswordById, deletePassword } from '$lib/db';
	import { decryptField } from '$lib/auth';
	import { addToast } from '$lib/toast-store';
	import type { DecryptedPasswordEntry } from '$lib/types';
	import PasswordView from '$lib/components/PasswordView.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import { resolve } from '$app/paths';

	let entry = $state<DecryptedPasswordEntry | null>(null);
	let loading = $state(true);
	let showDeleteConfirm = $state(false);

	onMount(async () => {
		const id = $page.params.id!;
		const raw = await getPasswordById(id);

		if (!raw) {
			goto(resolve('/passwords'));
			return;
		}

		const [password, notes] = await Promise.all([
			decryptField(raw.encrypted_password),
			decryptField(raw.notes)
		]);

		entry = {
			id: raw.id,
			name: raw.name,
			url: raw.url,
			username: raw.username,
			password,
			notes,
			category: raw.category,
			created_at: raw.created_at,
			updated_at: raw.updated_at
		};

		loading = false;
	});
</script>

{#if loading}
	<div class="flex items-center justify-center py-24">
		<div class="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else if entry}
	<div in:fly={{ x: 30, duration: 200 }}>
		<PasswordView
			{entry}
			onclose={() => goto(resolve('/passwords'))}
			onedit={() => goto(resolve(`/passwords/${entry!.id}/edit`))}
			ondelete={() => (showDeleteConfirm = true)}
		/>
	</div>
{/if}

{#if showDeleteConfirm}
	<ConfirmModal
		title="Delete Password"
		message="Are you sure? This action cannot be undone."
		confirmLabel="Delete"
		confirmDestructive={true}
		onconfirm={async () => {
			await deletePassword(entry!.id);
			addToast('Password deleted', 'info');
			goto(resolve('/passwords'));
		}}
		oncancel={() => (showDeleteConfirm = false)}
	/>
{/if}
