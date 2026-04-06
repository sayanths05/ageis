export interface EncryptionInfo {
	verification_hash: string;
	salt_v: string;
	salt_e: string;
	created_at: string;
}

export interface PasswordEntry {
	id: string;
	name: string;
	url: string;
	username: string;
	encrypted_password: string;
	notes: string;
	category: string;
	created_at: string;
	updated_at: string;
}

export interface DecryptedPasswordEntry {
	id: string;
	name: string;
	url: string;
	username: string;
	password: string;
	notes: string;
	category: string;
	created_at: string;
	updated_at: string;
}

export type AuthState =
	| { status: 'loading' }
	| { status: 'needs_file' }
	| { status: 'first_time_setup' }
	| { status: 'locked' }
	| { status: 'unlocked' };
