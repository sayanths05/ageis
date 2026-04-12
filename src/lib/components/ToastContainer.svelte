<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts, removeToast, type ToastType } from '$lib/toast-store';

	const styleMap: Record<ToastType, string> = {
		success: 'bg-green-900/80 border-green-700 text-green-200',
		error: 'bg-red-900/80 border-red-700 text-red-200',
		info: 'bg-slate-800/80 border-slate-600 text-slate-200'
	};

	function getStyle(type: ToastType): string {
		return styleMap[type] ?? styleMap.info;
	}
</script>

{#if $toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite" role="status">
		{#each $toasts as toast (toast.id)}
			<div
				class="max-w-xs rounded border px-4 py-2 shadow-lg backdrop-blur-sm {getStyle(toast.type)}"
				transition:fly={{ x: 30, duration: 200 }}
			>
				<div class="flex items-center justify-between gap-3">
					<span class="text-sm">{toast.message}</span>

					<button
						class="shrink-0 opacity-70 transition-opacity hover:opacity-100"
						onclick={() => removeToast(toast.id)}
						aria-label="Dismiss"
					>
						&#x2715;
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}
