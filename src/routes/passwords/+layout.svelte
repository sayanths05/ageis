<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { authState, handleLock, handleExportVault } from '$lib/auth-store';
	import { resetAutoLockTimer } from '$lib/auth';
	import { getStorageBackendSync } from '$lib/storage/storage';
	import { Lock, Download } from 'lucide-svelte';
	import ShieldLogo from '$lib/components/ShieldLogo.svelte';
    import { resolve } from '$app/paths';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	const showExport = !getStorageBackendSync()?.supportsFilePicker();

	let scrolled = $state(false);
	let lastActivity = 0;

	$effect(() => {
		if ($authState.status !== 'unlocked') {
			goto(resolve('/'));
		}
	});

	function handleActivity() {
		const now = Date.now();

		if (now - lastActivity < 30_000) return;

		lastActivity = now;
		resetAutoLockTimer();
	}

	function lock() {
		handleLock();
	}
</script>

<svelte:window
	onscroll={() => (scrolled = window.scrollY > 10)}
	onmousemove={handleActivity}
	onkeydown={handleActivity}
	onclick={handleActivity}
/>

<header class="sticky top-0 z-10 transition-all duration-200 {scrolled ? 'bg-slate-950/80 backdrop-blur-lg border-b border-slate-800' : ''}">
	<div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
				<ShieldLogo size={24} />
				<h1 class="text-2xl font-bold text-white">Aegis</h1>
			</div>

		<div class="flex gap-1">
			{#if showExport}
				<button
					onclick={handleExportVault}
					class="p-2 text-slate-500 hover:text-slate-300 transition-colors"
					title="Export vault"
				>
					<Download size={18} />
				</button>
			{/if}

			<button
				onclick={lock}
				class="p-2 text-slate-500 hover:text-slate-300 transition-colors"
				title="Lock vault"
			>
				<Lock size={18} />
			</button>
		</div>
	</div>
</header>

{@render children()}
