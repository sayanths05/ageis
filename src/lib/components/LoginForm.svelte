<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { handleUnlock, authError, authLoading } from '$lib/auth-store';
	import ShieldLogo from '$lib/components/ShieldLogo.svelte';

	let password = $state('');
	let passwordInput: HTMLInputElement;

	async function onSubmit(e: Event) {
		e.preventDefault();
		await handleUnlock(password);
	}

	onMount(() => {
		passwordInput?.focus();
	});
</script>

<div in:fly={{ y: 20, duration: 200 }} class="flex items-center justify-center min-h-screen px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="flex items-center justify-center gap-3 mb-2">
				<ShieldLogo size={40} />
				<h1 class="text-4xl font-bold text-white">Aegis</h1>
			</div>
			<p class="text-slate-400">A local password vault</p>
		</div>

		<form onsubmit={onSubmit} class="bg-slate-900 rounded-xl p-8 shadow-2xl border border-slate-800">
			<div class="mb-6">
				<label for="password" class="block text-sm font-medium text-slate-300 mb-2">
					Master Password
				</label>
				<input
					id="password"
					type="password"
					bind:this={passwordInput}
					bind:value={password}
					disabled={$authLoading}
					autocomplete="current-password"
					placeholder="Super secret password..."
					class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 disabled:opacity-50"
				/>
			</div>

			{#if $authError}
				<div in:fly={{ y: -10, duration: 150 }} class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
					{$authError}
				</div>
			{/if}

			<button
				type="submit"
				disabled={$authLoading}
				class="w-full py-3 bg-white hover:bg-slate-200 text-slate-950 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if $authLoading}
					<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
					Unlocking...
				{:else}
					Unlock
				{/if}
			</button>
		</form>
	</div>
</div>
