<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { beforeNavigate, goto } from '$app/navigation';
	import { encryptField, decryptField } from '$lib/auth';
	import { createPassword, updatePassword } from '$lib/db';
	import { addToast } from '$lib/toast-store';
	import type { PasswordEntry } from '$lib/types';
	import { ArrowLeft, Eye, EyeOff } from 'lucide-svelte';
	import { getPasswordStrength } from './PasswordStrength.svelte';
	import PasswordGenerator from './PasswordGenerator.svelte';
	import ConfirmModal from './ConfirmModal.svelte';

	interface Props {
		entry: PasswordEntry | null;
		onclose: () => void;
	}

	let { entry, onclose }: Props = $props();

	let name = $state('');
	let url = $state('');
	let username = $state('');
	let password = $state('');
	let notes = $state('');
	let category = $state('');
	let saving = $state(false);
	let error = $state('');
	let showPassword = $state(false);
	let showGenerator = $state(false);
	let showDiscardModal = $state(false);
	let pendingNavigation: (() => void) | null = null;
	let nameInput: HTMLInputElement;
	let originalValues = $state({ name: '', url: '', username: '', password: '', notes: '', category: '' });

	// Generator settings (persisted across open/close within the form session)
	let genLength = $state(20);
	let genUppercase = $state(true);
	let genLowercase = $state(true);
	let genNumbers = $state(true);
	let genSymbols = $state(true);
	let genAllowedSymbols = $state('!@#$%^&*_+-=');

	const strength = $derived(getPasswordStrength(password));

	const credentialBorder = $derived(
		strength.level > 0 ? strength.borderColor : 'border-slate-800/60'
	);

	const isDirty = $derived(
		name !== originalValues.name ||
		url !== originalValues.url ||
		username !== originalValues.username ||
		password !== originalValues.password ||
		notes !== originalValues.notes ||
		category !== originalValues.category
	);

	beforeNavigate((navigation) => {
		if (isDirty && !saving) {
			navigation.cancel();
			pendingNavigation = () => {
				originalValues = { name, url, username, password, notes, category };
				navigation.to?.url && goto(navigation.to.url);
			};
			showDiscardModal = true;
		}
	});

	onMount(() => {
		if (entry) {
			loadEntry(entry);
		} else {
			nameInput?.focus();
		}
	});

	async function loadEntry(e: PasswordEntry) {
		name = e.name;
		url = e.url;
		username = e.username;
		category = e.category;
		const [decryptedPassword, decryptedNotes] = await Promise.all([
			decryptField(e.encrypted_password),
			decryptField(e.notes)
		]);
		password = decryptedPassword;
		notes = decryptedNotes;
		originalValues = { name, url, username, password: decryptedPassword, notes: decryptedNotes, category };
	}

	function handleUseGenerated(generated: string) {
		password = generated;
		showPassword = true;
		showGenerator = false;
	}

	async function onSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!name.trim()) {
			error = 'Name is required.';
			return;
		}

		if (!password.trim()) {
			error = 'Password is required.';
			return;
		}

		saving = true;

		try {
			const [encryptedPassword, encryptedNotes] = await Promise.all([
				encryptField(password),
				notes ? encryptField(notes) : Promise.resolve('')
			]);

			if (entry) {
				await updatePassword(entry.id, {
					name: name.trim(),
					url: url.trim(),
					username: username.trim(),
					encrypted_password: encryptedPassword,
					notes: encryptedNotes,
					category: category.trim()
				});
			} else {
				await createPassword({
					name: name.trim(),
					url: url.trim(),
					username: username.trim(),
					encrypted_password: encryptedPassword,
					notes: encryptedNotes,
					category: category.trim()
				});
			}

			addToast(entry ? 'Password updated' : 'Password saved', 'success');
			originalValues = { name, url, username, password, notes, category };
			onclose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save password.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="max-w-lg mx-auto px-6 py-10">
	<!-- Header -->
	<div class="flex items-center justify-between mb-10">
		<button
			onclick={onclose}
			class="p-2 -ml-2 text-slate-500 hover:text-slate-300 transition-colors"
			title="Cancel"
		>
			<ArrowLeft size={20} />
		</button>

		<h2 class="text-lg font-semibold text-slate-100">
			{entry ? 'Edit Password' : 'New Password'}
		</h2>

		<button
			type="submit"
			form="password-form"
			disabled={saving}
			class="text-sm font-medium transition-colors disabled:opacity-40
				{saving ? 'text-slate-500' : 'text-white hover:text-slate-300'}"
		>
			{#if saving}
				Saving...
			{:else}
				{entry ? 'Save' : 'Add'}
			{/if}
		</button>
	</div>

	<form id="password-form" onsubmit={onSubmit}>
		<!-- Account group -->
		<div class="mb-6">
			<div class="bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden">
				<input
					bind:this={nameInput}
					type="text"
					bind:value={name}
					placeholder="Name"
					autocomplete="off"
					class="w-full px-4 py-3.5 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none focus:bg-slate-800/30 transition-colors"
				/>
				<div class="border-t border-slate-800/60"></div>
				<input
					type="text"
					inputmode="url"
					bind:value={url}
					placeholder="URL"
					autocomplete="off"
					class="w-full px-4 py-3.5 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none focus:bg-slate-800/30 transition-colors"
				/>
				<div class="border-t border-slate-800/60"></div>
				<input
					type="text"
					bind:value={username}
					placeholder="Username"
					autocomplete="off"
					class="w-full px-4 py-3.5 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none focus:bg-slate-800/30 transition-colors"
				/>
				<div class="border-t border-slate-800/60"></div>
				<input
					type="text"
					bind:value={category}
					placeholder="Category"
					class="w-full px-4 py-3.5 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none focus:bg-slate-800/30 transition-colors"
				/>
			</div>
		</div>

		<!-- Password group -->
		<div class="mb-6">
			<div class="bg-slate-900/50 border {credentialBorder} rounded-xl transition-colors duration-300">
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						placeholder="Password"
						autocomplete="off"
						class="w-full px-4 py-3.5 pr-24 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none focus:bg-slate-800/30 transition-colors"
					/>
					<div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
						<button
							type="button"
							onclick={() => (showGenerator = !showGenerator)}
							class="px-2 py-1 text-xs transition-colors
								{showGenerator ? 'text-slate-300' : 'text-slate-500 hover:text-slate-300'}"
						>
							{showGenerator ? 'Close' : 'Generate'}
						</button>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="p-1 text-slate-600 hover:text-slate-300 transition-colors"
						>
							{#if showPassword}
								<EyeOff size={16} />
							{:else}
								<Eye size={16} />
							{/if}
						</button>
					</div>
				</div>

				{#if showGenerator}
					<div class="border-t border-slate-800/60">
						<PasswordGenerator
							bind:length={genLength}
							bind:useUppercase={genUppercase}
							bind:useLowercase={genLowercase}
							bind:useNumbers={genNumbers}
							bind:useSymbols={genSymbols}
							bind:allowedSymbols={genAllowedSymbols}
							onuse={handleUseGenerated}
						/>
					</div>
				{/if}
			</div>

			{#if strength.level > 0}
				<p class="text-xs {strength.textColor} text-right mt-1.5 pr-1">{strength.label}</p>
			{/if}
		</div>

		<!-- Notes group -->
		<div class="mb-8">
			<div class="bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden">
				<textarea
					bind:value={notes}
					rows="3"
					placeholder="Notes"
					autocomplete="off"
					class="w-full px-4 py-3.5 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none focus:bg-slate-800/30 transition-colors resize-none"
				></textarea>
			</div>
		</div>

		{#if error}
			<div in:fly={{ y: -10, duration: 150 }} class="mb-6 py-3 px-4 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">
				{error}
			</div>
		{/if}
	</form>
</div>

{#if showDiscardModal}
	<ConfirmModal
		title="Unsaved Changes"
		message="You have unsaved changes. Discard them?"
		confirmLabel="Discard"
		confirmDestructive={true}
		onconfirm={() => {
			showDiscardModal = false;
			pendingNavigation?.();
			pendingNavigation = null;
		}}
		oncancel={() => {
			showDiscardModal = false;
			pendingNavigation = null;
		}}
	/>
{/if}
