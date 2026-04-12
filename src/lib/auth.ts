import {
	base64Decode,
	base64Encode,
	deriveEncryptionKey,
	deriveVerificationHash,
	encrypt,
	decrypt,
	generateSalt,
	verifyPassword
} from './crypto';
import { getEncryptionInfo, saveEncryptionInfo, isFirstTimeSetup, getDatabase } from './db';
import { getStorageBackend } from './storage/storage';
import type { AuthState } from './types';

export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

const AUTO_LOCK_MS = 5 * 60 * 1000;

let sessionKey: CryptoKey | null = null;
let lockTimeoutId: ReturnType<typeof setTimeout> | null = null;
let onAutoLock: (() => void) | null = null;

export function getSessionKey(): CryptoKey {
	if (!sessionKey) {
		throw new AuthError('No active session. Please unlock the vault.');
	}

	return sessionKey;
}

export function isUnlocked(): boolean {
	return sessionKey !== null;
}

function clearSession(): void {
	sessionKey = null;
}

export async function checkAuthState(): Promise<AuthState> {
	const storage = await getStorageBackend();

	if (storage.needsFilePick()) {
		return { status: 'needs_file' };
	}

	try {
		await getDatabase();
		const firstTime = await isFirstTimeSetup();

		if (firstTime) return { status: 'first_time_setup' };
		if (!sessionKey) return { status: 'locked' };

		return { status: 'unlocked' };
	} catch (error) {
		return { status: 'error', message: error instanceof Error ? error.message : 'Failed to check vault state.' };
	}
}

export async function setupMasterPassword(password: string): Promise<void> {
	if (password.length < 8) {
		throw new AuthError('Password must be at least 8 characters.');
	}

	const saltV = generateSalt();
	const saltE = generateSalt();

	const [{ hash }, encKey] = await Promise.all([
		deriveVerificationHash(password, saltV),
		deriveEncryptionKey(password, saltE)
	]);

	await saveEncryptionInfo({
		verification_hash: base64Encode(hash),
		salt_v: base64Encode(saltV),
		salt_e: base64Encode(saltE)
	});

	sessionKey = encKey;
}

export async function unlockVault(password: string): Promise<void> {
	const info = await getEncryptionInfo();

	if (!info) {
		throw new AuthError('No vault found. Please set up a master password first.');
	}

	const storedHash = base64Decode(info.verification_hash);
	const saltV = base64Decode(info.salt_v);
	const saltE = base64Decode(info.salt_e);

	const [isValid, encKey] = await Promise.all([
		verifyPassword(password, storedHash, saltV),
		deriveEncryptionKey(password, saltE)
	]);

	if (!isValid) {
		throw new AuthError('Incorrect master password.');
	}

	sessionKey = encKey;
}

export function lockVault(): void {
	clearSession();
	stopAutoLockTimer();
}

export async function encryptField(plaintext: string): Promise<string> {
	return encrypt(plaintext, getSessionKey());
}

export async function decryptField(encrypted: string): Promise<string> {
	if (!encrypted) return '';

	return decrypt(encrypted, getSessionKey());
}

// --- Auto-Lock ---

export function setAutoLockCallback(callback: () => void): void {
	onAutoLock = callback;
}

export function resetAutoLockTimer(): void {
	if (lockTimeoutId) {
		clearTimeout(lockTimeoutId);
	}

	if (!sessionKey) return;

	lockTimeoutId = setTimeout(() => {
		lockVault();
		onAutoLock?.();
	}, AUTO_LOCK_MS);
}

export function stopAutoLockTimer(): void {
	if (lockTimeoutId) {
		clearTimeout(lockTimeoutId);
		lockTimeoutId = null;
	}
}
