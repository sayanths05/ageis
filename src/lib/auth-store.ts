import { writable } from 'svelte/store';
import {
	checkAuthState,
	setupMasterPassword,
	unlockVault,
	lockVault,
	resetAutoLockTimer,
	setAutoLockCallback
} from './auth';
import { closeDatabase, exportDatabase, importDatabase } from './db';
import { getStorageBackend } from './storage/storage';
import type { AuthState } from './types';

export const authState = writable<AuthState>({ status: 'loading' });
export const authError = writable<string | null>(null);
export const authLoading = writable(false);

export async function initialize(): Promise<void> {
	setAutoLockCallback(async () => {
		await closeDatabase();
		authState.set({ status: 'locked' });
	});

	try {
		const state = await checkAuthState();
		authState.set(state);
	} catch (error) {
		console.error('Failed to initialize vault:', error);
		authState.set({ status: 'first_time_setup' });
	}
}

export async function handleSetup(password: string): Promise<boolean> {
	authError.set(null);
	authLoading.set(true);

	try {
		await setupMasterPassword(password);
		authState.set({ status: 'unlocked' });
		resetAutoLockTimer();

		return true;
	} catch (error) {
		authError.set(error instanceof Error ? error.message : 'Setup failed.');

		return false;
	} finally {
		authLoading.set(false);
	}
}

export async function handleUnlock(password: string): Promise<boolean> {
	authError.set(null);
	authLoading.set(true);

	try {
		await unlockVault(password);
		authState.set({ status: 'unlocked' });
		resetAutoLockTimer();

		return true;
	} catch (error) {
		authError.set(error instanceof Error ? error.message : 'Unlock failed.');

		return false;
	} finally {
		authLoading.set(false);
	}
}

export async function handleCreateNewVault(): Promise<void> {
	authError.set(null);

	try {
		const storage = await getStorageBackend();
		await storage.pickNewFile();

		if (storage.needsFilePick()) return;

		const state = await checkAuthState();
		authState.set(state);
	} catch (error) {
		authError.set(error instanceof Error ? error.message : 'Failed to create vault file.');
	}
}

export async function handleOpenExistingVault(): Promise<void> {
	authError.set(null);

	try {
		const storage = await getStorageBackend();
		await storage.pickExistingFile();

		if (storage.needsFilePick()) return;

		const state = await checkAuthState();
		authState.set(state);
	} catch (error) {
		authError.set(error instanceof Error ? error.message : 'Failed to open vault file.');
	}
}

export async function handleImportVault(): Promise<void> {
	authError.set(null);

	try {
		const imported = await importDatabase();

		if (!imported) return;

		const state = await checkAuthState();
		authState.set(state);
	} catch (error) {
		authError.set(error instanceof Error ? error.message : 'Failed to import vault.');
	}
}

export async function handleExportVault(): Promise<void> {
	authError.set(null);

	try {
		await exportDatabase();
	} catch (error) {
		authError.set(error instanceof Error ? error.message : 'Failed to export vault.');
	}
}

export async function handleLock(): Promise<void> {
	lockVault();
	await closeDatabase();
	authState.set({ status: 'locked' });
	authError.set(null);
}
