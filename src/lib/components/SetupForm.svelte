<script lang="ts">
	import { fly } from 'svelte/transition';
	import { handleSetup, handleImportVault, authError, authLoading } from '$lib/auth-store';
	import { getStorageBackendSync } from '$lib/storage/storage';
	import ShieldLogo from '$lib/components/ShieldLogo.svelte';
	import { getPasswordStrength } from './PasswordStrength.svelte';

	const showImport = !getStorageBackendSync()?.supportsFilePicker();

	let password = $state('');
	const strength = $derived(getPasswordStrength(password));
	let confirmPassword = $state('');
	let localError = $state('');

	async function onSubmit(e: Event) {
		e.preventDefault();
		localError = '';

		if (password.length < 8) {
			localError = 'Password must be at least 8 characters.';
			return;
		}

		if (password !== confirmPassword) {
			localError = 'Passwords do not match.';
			return;
		}

		await handleSetup(password);
	}

	const displayError = $derived(localError || $authError || '');
</script>

<div in:fly={{ y: 20, duration: 200 }} class="flex items-center justify-center min-h-screen px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="flex items-center justify-center gap-3 mb-2">
				<ShieldLogo size={40} />
				<h1 class="text-4xl font-bold text-white">Aegis</h1>
			</div>
			<p class="text-slate-400">Create your master password to get started</p>
		</div>

		<form onsubmit={onSubmit} class="bg-slate-900 rounded-xl p-8 shadow-2xl border border-slate-800">
			<div class="mb-6">
				<label for="password" class="block text-sm font-medium text-slate-300 mb-2">
					Master Password
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					disabled={$authLoading}
					placeholder="Enter master password (min 8 characters)"
					class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 disabled:opacity-50"
				/>
				{#if strength.level > 0}
				<p class="text-xs {strength.textColor} text-right mt-1.5 pr-1">{strength.label}</p>
			{/if}
			</div>

			<div class="mb-6">
				<label for="confirm-password" class="block text-sm font-medium text-slate-300 mb-2">
					Confirm Password
				</label>
				<input
					id="confirm-password"
					type="password"
					bind:value={confirmPassword}
					disabled={$authLoading}
					placeholder="Confirm master password"
					class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 disabled:opacity-50"
				/>
			</div>

			{#if displayError}
				<div in:fly={{ y: -10, duration: 150 }} class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
					{displayError}
				</div>
			{/if}

			<button
				type="submit"
				disabled={$authLoading}
				class="w-full py-3 bg-white hover:bg-slate-200 text-slate-950 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if $authLoading}
					<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
					Deriving keys...
				{:else}
					Create Vault
				{/if}
			</button>
		</form>

		{#if showImport}
			<div class="text-center mt-4">
				<button
					onclick={handleImportVault}
					class="text-sm text-slate-500 hover:text-slate-300 transition-colors"
				>
					Or import an existing vault backup
				</button>
			</div>
		{/if}
	</div>
</div>
