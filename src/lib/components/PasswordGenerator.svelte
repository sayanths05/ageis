<script lang="ts">
	import { RotateCw, Copy } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { addToast } from '$lib/toast-store';

	interface Props {
		length: number;
		useUppercase: boolean;
		useLowercase: boolean;
		useNumbers: boolean;
		useSymbols: boolean;
		allowedSymbols: string;
		onuse: (password: string) => void;
	}

	let {
		length = $bindable(),
		useUppercase = $bindable(),
		useLowercase = $bindable(),
		useNumbers = $bindable(),
		useSymbols = $bindable(),
		allowedSymbols = $bindable(),
		onuse
	}: Props = $props();

	let stagedPassword = $state('');

	const charset = $derived.by(() => {
		let chars = '';

		if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
		if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		if (useNumbers) chars += '0123456789';

		if (useSymbols && allowedSymbols) {
			// Deduplicate symbols and remove any that overlap with other categories
			const baseChars = new Set(chars);
			const seen = new Set<string>();

			for (const ch of allowedSymbols) {
				if (ch.trim() && !baseChars.has(ch) && !seen.has(ch)) {
					seen.add(ch);
					chars += ch;
				}
			}
		}

		return chars;
	});

	const activeCount = $derived(
		[useUppercase, useLowercase, useNumbers, useSymbols].filter(Boolean).length
	);

	function generate(chars: string, len: number) {
		if (chars.length === 0 || len <= 0) {
			stagedPassword = '';
			return;
		}

		const max = chars.length;
		const limit = Math.floor(0x100000000 / max) * max;
		const result: string[] = [];

		while (result.length < len) {
			const array = new Uint32Array(len - result.length);
			crypto.getRandomValues(array);

			for (const v of array) {
				if (v < limit && result.length < len) {
					result.push(chars[v % max]);
				}
			}
		}

		stagedPassword = result.join('');
	}

	function regenerate() {
		generate(charset, length);
	}

	function toggleCategory(category: 'uppercase' | 'lowercase' | 'numbers' | 'symbols') {
		const isCurrentlyOn = {
			uppercase: useUppercase,
			lowercase: useLowercase,
			numbers: useNumbers,
			symbols: useSymbols
		}[category];

		if (isCurrentlyOn && activeCount <= 1) return;

		if (category === 'uppercase') useUppercase = !useUppercase;
		else if (category === 'lowercase') useLowercase = !useLowercase;
		else if (category === 'numbers') useNumbers = !useNumbers;
		else if (category === 'symbols') useSymbols = !useSymbols;
	}

	async function copyStaged() {
		if (!stagedPassword) return;

		await navigator.clipboard.writeText(stagedPassword);
		addToast('Copied to clipboard', 'success');
	}

	function preventFormSubmit(e: KeyboardEvent) {
		if (e.key === 'Enter') e.preventDefault();
	}

	// Auto-regenerate when charset or length changes (excluding allowedSymbols typing, which is debounced)
	$effect(() => {
		const chars = charset;
		const len = length;

		generate(chars, len);
	});
</script>

<div in:slide={{ duration: 200 }} class="px-4 py-4">
	<!-- Staged password -->
	<div class="mb-4">
		<span class="block text-xs font-medium text-slate-500 tracking-wide uppercase mb-2">
			Generated Password
		</span>
		<div class="flex items-center gap-2">
			<input
				type="text"
				bind:value={stagedPassword}
				onkeydown={preventFormSubmit}
				class="flex-1 px-3 py-2.5 bg-slate-800/50 border border-slate-700/60 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:bg-slate-800/80 transition-colors"
			/>
			<button
				type="button"
				onclick={regenerate}
				class="p-2 text-slate-500 hover:text-slate-300 transition-colors"
				title="Regenerate"
			>
				<RotateCw size={15} />
			</button>
			<button
				type="button"
				onclick={copyStaged}
				class="p-2 text-slate-500 hover:text-slate-300 transition-colors {!stagedPassword ? 'opacity-40 pointer-events-none' : ''}"
				title="Copy"
			>
				<Copy size={15} />
			</button>
		</div>
	</div>

	<!-- Length slider -->
	<div class="mb-4">
		<div class="flex items-center justify-between mb-2">
			<span class="text-xs font-medium text-slate-500 tracking-wide uppercase">Length</span>
			<span class="text-xs font-mono text-slate-400">{length}</span>
		</div>
		<input
			type="range"
			min="8"
			max="64"
			bind:value={length}
			style="--range-progress: {((length - 8) / (64 - 8)) * 100}%"
			class="range-slider w-full"
		/>
	</div>

	<!-- Character type toggles -->
	<div class="mb-4">
		<span class="block text-xs font-medium text-slate-500 tracking-wide uppercase mb-2">
			Characters
		</span>
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				aria-pressed={useUppercase}
				onclick={() => toggleCategory('uppercase')}
				class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors
					{useUppercase
					? 'bg-slate-700 text-slate-100'
					: 'bg-transparent text-slate-600 hover:text-slate-400'}"
			>
				ABC
			</button>
			<button
				type="button"
				aria-pressed={useLowercase}
				onclick={() => toggleCategory('lowercase')}
				class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors
					{useLowercase
					? 'bg-slate-700 text-slate-100'
					: 'bg-transparent text-slate-600 hover:text-slate-400'}"
			>
				abc
			</button>
			<button
				type="button"
				aria-pressed={useNumbers}
				onclick={() => toggleCategory('numbers')}
				class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors
					{useNumbers
					? 'bg-slate-700 text-slate-100'
					: 'bg-transparent text-slate-600 hover:text-slate-400'}"
			>
				123
			</button>
			<button
				type="button"
				aria-pressed={useSymbols}
				onclick={() => toggleCategory('symbols')}
				class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors
					{useSymbols
					? 'bg-slate-700 text-slate-100'
					: 'bg-transparent text-slate-600 hover:text-slate-400'}"
			>
				#$%
			</button>
		</div>
	</div>

	<!-- Allowed symbols -->
	{#if useSymbols}
		<div class="mb-4" in:slide={{ duration: 150 }}>
			<span class="block text-xs font-medium text-slate-500 tracking-wide uppercase mb-2">
				Allowed Symbols
			</span>
			<input
				type="text"
				bind:value={allowedSymbols}
				onkeydown={preventFormSubmit}
				class="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/60 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:bg-slate-800/80 transition-colors"
			/>
		</div>
	{/if}

	<!-- Use button -->
	<button
		type="button"
		onclick={() => onuse(stagedPassword)}
		disabled={!stagedPassword}
		class="w-full py-2.5 bg-white hover:bg-slate-200 text-slate-950 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
	>
		Use This Password
	</button>
</div>

<style>
	.range-slider {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		border-radius: 2px;
		background: linear-gradient(
			to right,
			rgb(148 163 184) var(--range-progress, 50%),
			rgb(51 65 85) var(--range-progress, 50%)
		);
		cursor: pointer;
		outline: none;
	}

	.range-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 0 0 3px rgb(255 255 255 / 0.1);
	}

	.range-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 0 0 3px rgb(255 255 255 / 0.1);
	}

	.range-slider::-moz-range-track {
		height: 4px;
		border-radius: 2px;
		background: linear-gradient(
			to right,
			rgb(148 163 184) var(--range-progress, 50%),
			rgb(51 65 85) var(--range-progress, 50%)
		);
	}
</style>
