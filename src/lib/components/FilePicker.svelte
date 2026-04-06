<script lang="ts">
	import { fly } from 'svelte/transition';
	import {
		handleCreateNewVault,
		handleOpenExistingVault,
		handleImportVault,
		authError
	} from '$lib/auth-store';
	import { getStorageBackendSync } from '$lib/storage/storage';
	import ShieldLogo from '$lib/components/ShieldLogo.svelte';

	const storage = getStorageBackendSync();
	const isFilePicker = storage?.supportsFilePicker() ?? false;
</script>

<div in:fly={{ y: 20, duration: 200 }} class="flex items-center justify-center min-h-screen px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="flex items-center justify-center gap-3 mb-2">
				<ShieldLogo size={40} />
				<h1 class="text-4xl font-bold text-white">Aegis</h1>
			</div>
			<p class="text-slate-400">
				{isFilePicker
					? 'Choose where to store your vault'
					: 'Create or import your vault'}
			</p>
		</div>

		<div class="bg-slate-900 rounded-xl p-8 shadow-2xl border border-slate-800 space-y-4">
			{#if isFilePicker}
				<button
					onclick={handleCreateNewVault}
					class="w-full py-4 px-6 bg-white hover:bg-slate-200 text-slate-950 font-medium rounded-lg transition-colors text-left"
				>
					<div class="font-semibold">Create New Vault</div>
					<div class="text-sm text-slate-600 mt-1">Pick a location to save your new database file</div>
				</button>

				<button
					onclick={handleOpenExistingVault}
					class="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-lg transition-colors border border-slate-700 text-left"
				>
					<div class="font-semibold">Open Existing Vault</div>
					<div class="text-sm text-slate-400 mt-1">Select an existing .db file to unlock</div>
				</button>
			{:else}
				<button
					onclick={handleCreateNewVault}
					class="w-full py-4 px-6 bg-white hover:bg-slate-200 text-slate-950 font-medium rounded-lg transition-colors text-left"
				>
					<div class="font-semibold">Create New Vault</div>
					<div class="text-sm text-slate-600 mt-1">Start fresh with a new encrypted vault</div>
				</button>

				<button
					onclick={handleImportVault}
					class="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-lg transition-colors border border-slate-700 text-left"
				>
					<div class="font-semibold">Import Existing Vault</div>
					<div class="text-sm text-slate-400 mt-1">Restore from a .db backup file</div>
				</button>
			{/if}

			{#if $authError}
				<div class="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
					{$authError}
				</div>
			{/if}

			<p class="text-center text-slate-600 text-xs pt-2">
				{isFilePicker
					? 'Your vault is stored as a local file on your machine.'
					: 'Your vault is stored in your browser. Use Export to back up.'}
			</p>
		</div>
	</div>
</div>
