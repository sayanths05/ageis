import argon2 from 'argon2-wasm-esm';

const ARGON2_MEMORY_KIB = 19456;
const ARGON2_ITERATIONS = 2;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12;

export class CryptoError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = 'CryptoError';
	}
}

export class DecryptionError extends CryptoError {
	constructor(cause?: unknown) {
		super('Decryption failed. The data may be corrupted or the key is incorrect.', cause);
		this.name = 'DecryptionError';
	}
}

export function generateSalt(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
}

export function base64Encode(data: Uint8Array): string {
	let binary = '';

	for (let i = 0; i < data.length; i++) {
		binary += String.fromCharCode(data[i]);
	}

	return btoa(binary);
}

export function base64Decode(encoded: string): Uint8Array {
	const binary = atob(encoded);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;

	let diff = 0;

	for (let i = 0; i < a.length; i++) {
		diff |= a[i] ^ b[i];
	}

	return diff === 0;
}

async function argon2Hash(password: string, salt: Uint8Array): Promise<Uint8Array> {
	const result = await argon2.hash({
		pass: password,
		salt,
		time: ARGON2_ITERATIONS,
		mem: ARGON2_MEMORY_KIB,
		hashLen: ARGON2_HASH_LENGTH,
		parallelism: ARGON2_PARALLELISM,
		type: argon2.ArgonType.argon2id
	});

	return result.hash;
}

export async function deriveVerificationHash(
	password: string,
	salt?: Uint8Array
): Promise<{ hash: Uint8Array; salt: Uint8Array }> {
	const actualSalt = salt ?? generateSalt();
	const hash = await argon2Hash(password, actualSalt);

	return { hash, salt: actualSalt };
}

export async function deriveEncryptionKey(
	password: string,
	salt: Uint8Array
): Promise<CryptoKey> {
	const rawKey = await argon2Hash(password, salt);

	return crypto.subtle.importKey(
		'raw',
		rawKey.buffer as ArrayBuffer,
		{ name: 'AES-GCM' },
		false,
		['encrypt', 'decrypt']
	);
}

export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
	const encoded = new TextEncoder().encode(plaintext);

	const ciphertextBuffer = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		encoded
	);

	const ciphertext = new Uint8Array(ciphertextBuffer);
	const combined = new Uint8Array(IV_LENGTH_BYTES + ciphertext.length);
	combined.set(iv, 0);
	combined.set(ciphertext, IV_LENGTH_BYTES);

	return base64Encode(combined);
}

export async function decrypt(encrypted: string, key: CryptoKey): Promise<string> {
	try {
		const combined = base64Decode(encrypted);
		const iv = combined.slice(0, IV_LENGTH_BYTES);
		const ciphertextWithTag = combined.slice(IV_LENGTH_BYTES);

		const plaintextBuffer = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv },
			key,
			ciphertextWithTag
		);

		return new TextDecoder().decode(plaintextBuffer);
	} catch (error) {
		throw new DecryptionError(error);
	}
}

export async function verifyPassword(
	password: string,
	storedHash: Uint8Array,
	salt: Uint8Array
): Promise<boolean> {
	const { hash: derivedHash } = await deriveVerificationHash(password, salt);

	return constantTimeEqual(derivedHash, storedHash);
}
