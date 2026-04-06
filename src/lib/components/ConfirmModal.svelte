<script lang="ts">
	import { fly, fade } from 'svelte/transition';

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
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
	transition:fade={{ duration: 150 }}
	onkeydown={(e) => { if (e.key === 'Escape') oncancel(); }}
	onclick={oncancel}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		in:fly={{ y: 10, duration: 150 }}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		<h2 class="text-lg font-semibold text-slate-100">{title}</h2>

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
