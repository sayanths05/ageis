<script lang="ts">
	import type { DecryptedPasswordEntry } from '$lib/types';
	import { addToast } from '$lib/toast-store';
	import { getInitial, getColorForName } from '$lib/colors';
	import { ArrowLeft, Pencil, Trash2, ExternalLink } from 'lucide-svelte';
    import { getFaviconUrl, handleFaviconError } from '$lib/utils';

	interface Props {
		entry: DecryptedPasswordEntry;
		onclose: () => void;
		onedit?: () => void;
		ondelete?: () => void;
	}

	let { entry, onclose, onedit, ondelete }: Props = $props();

	let showPassword = $state(false);
	let copied = $state('');

	const color = $derived(getColorForName(entry.name));
	const favicon = $derived(getFaviconUrl(entry.url));

	async function copyToClipboard(text: string, field: string) {
		await navigator.clipboard.writeText(text);
		copied = field;
		addToast('Copied to clipboard', 'success');
		setTimeout(() => (copied = ''), 1500);
	}

	function copyPassword() {
		copyToClipboard(entry.password, 'password');
	}
</script>

<div class="max-w-lg mx-auto px-6 py-10">
	<!-- Navigation -->
	<div class="flex items-center justify-between mb-12">
		<button
			onclick={onclose}
			class="p-2 -ml-2 text-slate-500 hover:text-slate-300 transition-colors"
			title="Back"
		>
			<ArrowLeft size={20} />
		</button>

		<div class="flex items-center gap-3">
			{#if onedit}
				<button
					onclick={onedit}
					class="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
				>
					<Pencil size={14} />
					Edit
				</button>
			{/if}

			{#if ondelete}
				<button
					onclick={ondelete}
					class="p-2 text-slate-600 hover:text-red-400 transition-colors"
					title="Delete"
				>
					<Trash2 size={16} />
				</button>
			{/if}
		</div>
	</div>

	<!-- Hero -->
	<div class="flex flex-col items-center mb-12">
		<div class="relative w-16 h-16 mb-4">
			{#if favicon}
				<img
					src={favicon}
					alt=""
					class="w-16 h-16 rounded-full object-cover bg-slate-800"
					onerror={handleFaviconError}
				/>
				<div
					class="w-16 h-16 rounded-full {color.bg} items-center justify-center hidden"
				>
					<span class="text-xl font-semibold {color.text}">{getInitial(entry.name)}</span>
				</div>
			{:else}
				<div class="w-16 h-16 rounded-full {color.bg} flex items-center justify-center">
					<span class="text-xl font-semibold {color.text}">{getInitial(entry.name)}</span>
				</div>
			{/if}
		</div>

		<h2 class="text-2xl font-semibold text-slate-100 mb-1">{entry.name}</h2>

		<div class="flex items-center gap-2 mt-1">
			{#if entry.category}
				{@const catColor = getColorForName(entry.category)}
				<span class="inline-flex items-center gap-1.5 text-sm text-slate-500">
					<span class="w-1.5 h-1.5 rounded-full {catColor.dot} inline-block"></span>
					{entry.category}
				</span>
			{/if}

			{#if entry.category && entry.url}
				<span class="text-slate-700">·</span>
			{/if}

			{#if entry.url}
				<a
					href={entry.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
				>
					{entry.url.replace(/^https?:\/\//, '')}
					<ExternalLink size={11} />
				</a>
			{/if}
		</div>
	</div>

	<!-- Credential rows -->
	<div class="space-y-0">
		{#if entry.username}
			<button
				onclick={() => copyToClipboard(entry.username, 'username')}
				class="w-full text-left px-5 py-5 border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer group"
			>
				<span class="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
					Username
				</span>
				<span class="text-slate-100 block truncate {copied === 'username' ? 'text-green-400' : ''}">
					{entry.username}
				</span>
				<span class="text-[10px] text-slate-600 mt-1.5 block opacity-0 group-hover:opacity-100 transition-opacity">
					{copied === 'username' ? 'Copied' : 'Tap to copy'}
				</span>
			</button>
		{/if}

		<button
			onclick={copyPassword}
			class="w-full text-left px-5 py-5 border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer group"
		>
			<span class="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
				Password
			</span>
			<span class="text-slate-100 font-mono block {copied === 'password' ? 'text-green-400' : ''}">
				{showPassword ? entry.password : '\u2022'.repeat(12)}
			</span>
			<span class="text-[10px] mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
				<span
					role="button"
					tabindex="0"
					onclick={(e) => { e.stopPropagation(); showPassword = !showPassword; }}
					onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); showPassword = !showPassword; } }}
					class="text-slate-500 hover:text-slate-300 transition-colors"
				>
					{showPassword ? 'Hide' : 'Reveal'}
				</span>
				<span class="text-slate-700">·</span>
				<span class="text-slate-600">
					{copied === 'password' ? 'Copied' : 'Tap to copy'}
				</span>
			</span>
		</button>

		{#if entry.url}
			<button
				onclick={() => copyToClipboard(entry.url, 'url')}
				class="w-full text-left px-5 py-5 border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer group"
			>
				<span class="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
					URL
				</span>
				<span class="text-slate-100 block truncate {copied === 'url' ? 'text-green-400' : ''}">
					{entry.url}
				</span>
				<span class="text-[10px] text-slate-600 mt-1.5 block opacity-0 group-hover:opacity-100 transition-opacity">
					{copied === 'url' ? 'Copied' : 'Tap to copy'}
				</span>
			</button>
		{/if}

		{#if entry.notes}
			<div class="px-5 py-5 border-t border-slate-800/60">
				<span class="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
					Notes
				</span>
				<p class="text-slate-300 whitespace-pre-wrap leading-relaxed">{entry.notes}</p>
			</div>
		{/if}

		<div class="border-t border-slate-800/60"></div>
	</div>
</div>
