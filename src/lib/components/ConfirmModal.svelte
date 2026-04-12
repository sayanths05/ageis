<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	interface Props {
		title: string;
		message: string;
		confirmLabel?: string;
		confirmDestructive?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	}

	const {
		title,
		message,
		confirmLabel = 'Confirm',
		confirmDestructive = false,
		onconfirm,
		oncancel
	}: Props = $props();

	let modalEl: HTMLDivElement;

	onMount(() => {
		const focusable = modalEl.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstFocusable = focusable[0];
		const lastFocusable = focusable[focusable.length - 1];

		firstFocusable?.focus();

		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				oncancel();
				return;
			}

			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				if (document.activeElement === firstFocusable) {
					e.preventDefault();
					lastFocusable?.focus();
				}
			} else {
				if (document.activeElement === lastFocusable) {
					e.preventDefault();
					firstFocusable?.focus();
				}
			}
		}

		modalEl.addEventListener('keydown', handleKeydown);

		return () => modalEl.removeEventListener('keydown', handleKeydown);
	});
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
	role="presentation"
	transition:fade={{ duration: 150 }}
	onclick={oncancel}
	onkeydown={(e) => { if (e.key === 'Escape') oncancel(); }}
>
	<div
		bind:this={modalEl}
		class="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-modal-title"
		tabindex="-1"
		in:fly={{ y: 10, duration: 150 }}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		<h2 id="confirm-modal-title" class="text-lg font-semibold text-slate-100">{title}</h2>

		<p class="mt-2 text-sm text-slate-400">{message}</p>

		<div class="mt-6 flex justify-end gap-3">
			<button
				class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
				onclick={oncancel}
			>
				Cancel
			</button>

			<button
				class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors {confirmDestructive
					? 'bg-red-600 hover:bg-red-500'
					: 'bg-white hover:bg-slate-200 text-slate-950'}"
				onclick={onconfirm}
			>
				{confirmLabel}
			</button>
		</div>
	</div>
</div>
