<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { getAllPasswords, deletePassword, searchPasswords } from '$lib/db';
	import { addToast } from '$lib/toast-store';
	import { getInitial, getColorForName } from '$lib/colors';
	import type { PasswordEntry } from '$lib/types';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	import ShieldLogo from '$lib/components/ShieldLogo.svelte';
	import { Search, ArrowUpDown, Plus } from 'lucide-svelte';
	import { getFaviconUrl, handleFaviconError } from '$lib/utils';
    import { resolve } from '$app/paths';

	type SortOption = 'name' | 'updated' | 'created';

	let allPasswords = $state<PasswordEntry[]>([]);
	let passwords = $state<PasswordEntry[]>([]);
	let searchQuery = $state('');
	let selectedCategory = $state('');
	let sortBy = $state<SortOption>('name');
	let showSortMenu = $state(false);
	let loading = $state(true);
	let deletingId = $state<string | null>(null);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const hasPasswords = $derived(allPasswords.length > 0);

	const categories = $derived(
		[...new Set(allPasswords.map((p) => p.category).filter(Boolean))].sort()
	);

	const filteredPasswords = $derived.by(() => {
		let result = passwords.filter((p) => {
			if (selectedCategory && p.category !== selectedCategory) return false;
			return true;
		});

		if (sortBy === 'updated') {
			result = [...result].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
		} else if (sortBy === 'created') {
			result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at));
		}

		return result;
	});

	const sortLabel = $derived(
		({ name: 'A–Z', updated: 'Recent', created: 'Newest' } as const)[sortBy]
	);

	async function loadPasswords() {
		loading = true;

		try {
			if (searchQuery) {
				passwords = await searchPasswords(searchQuery);
			} else {
				const all = await getAllPasswords();
				allPasswords = all;
				passwords = all;
			}
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		if (debounceTimer) clearTimeout(debounceTimer);

		debounceTimer = setTimeout(() => {
			loadPasswords();
		}, 200);
	}

	function handleDelete(id: string) {
		deletingId = id;
	}

	async function confirmDelete() {
		if (!deletingId) return;

		await deletePassword(deletingId);
		addToast('Password deleted', 'info');
		deletingId = null;
		await loadPasswords();
	}

	function handleView(entry: PasswordEntry) {
		goto(resolve(`/passwords/${entry.id}`));
	}

	function selectCategory(category: string) {
		selectedCategory = selectedCategory === category ? '' : category;
	}

	function selectSort(option: SortOption) {
		sortBy = option;
		showSortMenu = false;
	}

	

	onMount(() => {
		loadPasswords();
	});
</script>

<svelte:window onclick={() => (showSortMenu = false)} />

<div class="max-w-2xl mx-auto px-6 py-6">
	<!-- Search -->
	<div class="relative mb-5">
		<Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
		<input
			type="text"
			bind:value={searchQuery}
			oninput={handleSearch}
			placeholder="Search..."
			class="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-800/60 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
		/>
	</div>

	<!-- Filters row: categories + sort -->
	{#if hasPasswords}
		<div class="flex items-center justify-between mb-6 gap-3">
			<div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
				{#if categories.length > 0}
					{#each categories as category}
						{@const catColor = getColorForName(category)}
						<button
							onclick={() => selectCategory(category)}
							class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors
								{selectedCategory === category
								? 'bg-slate-700 text-slate-100'
								: 'bg-slate-900/50 text-slate-500 hover:text-slate-300'}"
						>
							<span class="w-1.5 h-1.5 rounded-full {catColor.dot} inline-block"></span>
							{category}
						</button>
					{/each}
				{/if}
			</div>

			<!-- Sort -->
			<div class="relative flex-shrink-0">
				<button
					onclick={(e) => { e.stopPropagation(); showSortMenu = !showSortMenu; }}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
				>
					<ArrowUpDown size={14} />
					{sortLabel}
				</button>

				{#if showSortMenu}
					<div
						class="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 min-w-[120px]"
					>
						<button
							onclick={() => selectSort('name')}
							class="w-full text-left px-4 py-2.5 text-sm transition-colors
								{sortBy === 'name' ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'}"
						>
							A–Z
						</button>
						<button
							onclick={() => selectSort('updated')}
							class="w-full text-left px-4 py-2.5 text-sm transition-colors
								{sortBy === 'updated' ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'}"
						>
							Recent
						</button>
						<button
							onclick={() => selectSort('created')}
							class="w-full text-left px-4 py-2.5 text-sm transition-colors
								{sortBy === 'created' ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'}"
						>
							Newest
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- List -->
	{#if loading}
		<div class="text-center py-16 text-slate-500">
			<div class="inline-block w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin"></div>
		</div>
	{:else if filteredPasswords.length === 0 && !hasPasswords}
		<div in:fly={{ y: 10, duration: 150 }}>
			<button
				onclick={() => goto(resolve('/passwords/add'))}
				class="w-full text-left flex items-center gap-4 px-4 py-4 hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-800/40"
			>
				<div class="w-10 h-10 rounded-full border border-dashed border-slate-600 flex items-center justify-center flex-shrink-0">
					<Plus size={18} class="text-slate-500" />
				</div>
				<span class="text-sm font-medium text-slate-400">Add new password</span>
			</button>
			<div class="flex flex-col items-center py-12 gap-2">
				<div class="opacity-30 mb-1">
					<ShieldLogo size={44} />
				</div>
				<p class="text-slate-500 text-sm">Your vault is empty</p>
				<p class="text-slate-600 text-xs">Add your first password to get started</p>
			</div>
		</div>
	{:else if filteredPasswords.length === 0}
		<div in:fly={{ y: 10, duration: 150 }} class="text-center py-20">
			<p class="text-slate-500">No results found</p>
		</div>
	{:else}
		<div>
			{#if !searchQuery && !selectedCategory}
				<button
					onclick={() => goto(resolve('/passwords/add'))}
					class="w-full text-left flex items-center gap-4 px-4 py-4 hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-800/40"
				>
					<div class="w-10 h-10 rounded-full border border-dashed border-slate-600 flex items-center justify-center flex-shrink-0">
						<Plus size={18} class="text-slate-500" />
					</div>
					<span class="text-sm font-medium text-slate-400">Add new password</span>
				</button>
			{/if}

			{#each filteredPasswords as entry, i (entry.id)}
				{@const color = getColorForName(entry.name)}
				{@const favicon = getFaviconUrl(entry.url)}
				<button
					in:fly={{ y: 15, duration: 150, delay: i < 5 ? i * 30 : 0 }}
					onclick={() => handleView(entry)}
					class="w-full text-left flex items-center gap-4 px-4 py-4 hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-800/40"
				>
					<!-- Avatar / Favicon -->
					<div class="relative w-10 h-10 flex-shrink-0">
						{#if favicon}
							<img
								src={favicon}
								alt=""
								class="w-10 h-10 rounded-full object-cover bg-slate-800"
								onerror={handleFaviconError}
							/>
							<div
								class="w-10 h-10 rounded-full {color.bg} items-center justify-center flex-shrink-0 hidden"
							>
								<span class="text-sm font-semibold {color.text}">{getInitial(entry.name)}</span>
							</div>
						{:else}
							<div class="w-10 h-10 rounded-full {color.bg} flex items-center justify-center">
								<span class="text-sm font-semibold {color.text}">{getInitial(entry.name)}</span>
							</div>
						{/if}
					</div>

					<!-- Content -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-medium text-slate-100 truncate">{entry.name}</span>

							{#if entry.category}
								{@const catColor = getColorForName(entry.category)}
								<span class="flex-shrink-0 w-1.5 h-1.5 rounded-full {catColor.dot}"></span>
							{/if}
						</div>

						{#if entry.username}
							<span class="text-sm text-slate-500 block truncate mt-0.5">{entry.username}</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if deletingId}
	<ConfirmModal
		title="Delete Password"
		message="Are you sure? This action cannot be undone."
		confirmLabel="Delete"
		confirmDestructive={true}
		onconfirm={confirmDelete}
		oncancel={() => (deletingId = null)}
	/>
{/if}

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
