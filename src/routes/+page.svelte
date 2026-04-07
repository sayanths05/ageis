<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base, resolve } from '$app/paths';
	import { authState, initialize } from '$lib/auth-store';
	import FilePicker from '$lib/components/FilePicker.svelte';
	import SetupForm from '$lib/components/SetupForm.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';

	let initError = $state('');

	onMount(async () => {
		try {
			await initialize();
		} catch (error) {
			console.error('Init failed:', error);
			initError = error instanceof Error ? error.message : 'Failed to initialize.';
		}
	});

	$effect(() => {
		if ($authState.status === 'unlocked') {
			goto(resolve('/passwords'));
		}
	});
</script>

{#if initError}
	<div class="flex items-center justify-center min-h-screen px-4">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-red-400 mb-4">Initialization Failed</h1>
			<p class="text-slate-400 mb-2">{initError}</p>
			<p class="text-slate-500 text-sm">Check the browser console for details.</p>
		</div>
	</div>
{:else if $authState.status === 'loading'}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div class="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
			<p class="mt-4 text-slate-400">Initializing vault...</p>
		</div>
	</div>
{:else if $authState.status === 'needs_file'}
	<FilePicker />
{:else if $authState.status === 'first_time_setup'}
	<SetupForm />
{:else if $authState.status === 'locked'}
	<LoginForm />
{/if}
