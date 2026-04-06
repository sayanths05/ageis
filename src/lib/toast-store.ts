import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';


export interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

let nextId = 0;

export const toasts = writable<Toast[]>([]);

export function addToast(message: string, type: ToastType, duration = 2000): void {
	const id = nextId++;

	toasts.update((current) => [...current, { id, message, type }]);

	setTimeout(() => removeToast(id), duration);
}

export function removeToast(id: number): void {
	toasts.update((current) => current.filter((t) => t.id !== id));
}
