import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { base } from '$app/paths';
import { uuidv7 } from 'uuidv7';
import type { EncryptionInfo, PasswordEntry } from './types';
import { getStorageBackend, type StorageBackend } from './storage/storage';

export class DatabaseError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = 'DatabaseError';
	}
}

const VALID_PASSWORD_COLUMNS = new Set([
	'name', 'url', 'username', 'encrypted_password', 'notes', 'category'
]);

// --- Database Singleton ---

let sqlModule: Awaited<ReturnType<typeof initSqlJs>> | null = null;
let db: SqlJsDatabase | null = null;
let storage: StorageBackend | null = null;

async function getSqlModule() {
	if (sqlModule) return sqlModule;

	sqlModule = await initSqlJs({
		locateFile: (file: string) => `${base}/${file}`
	});

	return sqlModule;
}

function initializeSchema(database: SqlJsDatabase): void {
	database.run(`
		CREATE TABLE IF NOT EXISTS enc_info (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			verification_hash TEXT NOT NULL,
			salt_v TEXT NOT NULL,
			salt_e TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		)
	`);

	database.run(`
		CREATE TABLE IF NOT EXISTS passwords (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			url TEXT NOT NULL DEFAULT '',
			username TEXT NOT NULL DEFAULT '',
			encrypted_password TEXT NOT NULL,
			notes TEXT NOT NULL DEFAULT '',
			category TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		)
	`);
}

export async function getDatabase(): Promise<SqlJsDatabase> {
	if (db) return db;

	storage = await getStorageBackend();

	if (!storage.isReady() && storage.needsFilePick()) {
		throw new DatabaseError('No database file selected. Please pick a file first.');
	}

	try {
		const SQL = await getSqlModule();
		const existingData = await storage.load();

		db = existingData ? new SQL.Database(existingData) : new SQL.Database();
		initializeSchema(db);

		return db;
	} catch (error) {
		if (error instanceof DatabaseError) throw error;
		throw new DatabaseError('Failed to initialize database', error);
	}
}

export async function persistDatabase(): Promise<void> {
	if (!db || !storage) return;

	const data = db.export();
	await storage.save(new Uint8Array(data));
}

export async function exportDatabase(): Promise<void> {
	if (!db || !storage) return;

	const data = db.export();
	await storage.exportToFile(new Uint8Array(data));
}

export async function importDatabase(): Promise<boolean> {
	if (!storage) {
		storage = await getStorageBackend();
	}

	const data = await storage.importFromFile();

	if (!data) return false;

	// Close existing db if open
	if (db) {
		db.close();
		db = null;
	}

	return true;
}

export async function closeDatabase(): Promise<void> {
	if (!db) return;

	await persistDatabase();
	db.close();
	db = null;
}

// --- enc_info CRUD ---

export async function getEncryptionInfo(): Promise<EncryptionInfo | null> {
	const database = await getDatabase();
	const results = database.exec(
		'SELECT verification_hash, salt_v, salt_e, created_at FROM enc_info WHERE id = 1'
	);

	if (results.length === 0 || results[0].values.length === 0) return null;

	const row = results[0].values[0];

	return {
		verification_hash: row[0] as string,
		salt_v: row[1] as string,
		salt_e: row[2] as string,
		created_at: row[3] as string
	};
}

export async function saveEncryptionInfo(
	info: Omit<EncryptionInfo, 'created_at'>
): Promise<void> {
	const database = await getDatabase();

	database.run(
		'INSERT INTO enc_info (id, verification_hash, salt_v, salt_e) VALUES (1, ?, ?, ?)',
		[info.verification_hash, info.salt_v, info.salt_e]
	);

	await persistDatabase();
}

export async function isFirstTimeSetup(): Promise<boolean> {
	return (await getEncryptionInfo()) === null;
}

// --- Passwords CRUD ---

export async function getAllPasswords(): Promise<PasswordEntry[]> {
	const database = await getDatabase();
	const results = database.exec(
		'SELECT id, name, url, username, encrypted_password, notes, category, created_at, updated_at FROM passwords ORDER BY name COLLATE NOCASE ASC'
	);

	if (results.length === 0) return [];

	return results[0].values.map(mapRowToPasswordEntry);
}

export async function getPasswordById(id: string): Promise<PasswordEntry | null> {
	const database = await getDatabase();
	const results = database.exec(
		'SELECT id, name, url, username, encrypted_password, notes, category, created_at, updated_at FROM passwords WHERE id = ?',
		[id]
	);

	if (results.length === 0 || results[0].values.length === 0) return null;

	return mapRowToPasswordEntry(results[0].values[0]);
}

export async function createPassword(
	entry: Omit<PasswordEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<PasswordEntry> {
	const database = await getDatabase();
	const id = uuidv7();
	const now = new Date().toISOString();

	database.run(
		'INSERT INTO passwords (id, name, url, username, encrypted_password, notes, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[id, entry.name, entry.url, entry.username, entry.encrypted_password, entry.notes, entry.category, now, now]
	);

	await persistDatabase();

	return { id, ...entry, created_at: now, updated_at: now };
}

export async function updatePassword(
	id: string,
	updates: Partial<Omit<PasswordEntry, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
	const database = await getDatabase();
	const now = new Date().toISOString();

	const fields: string[] = [];
	const values: (string | number)[] = [];

	for (const [key, value] of Object.entries(updates)) {
		if (value === undefined) continue;

		if (!VALID_PASSWORD_COLUMNS.has(key)) {
			throw new DatabaseError(`Invalid column name: ${key}`);
		}

		fields.push(`${key} = ?`);
		values.push(value);
	}

	if (fields.length === 0) return;

	fields.push('updated_at = ?');
	values.push(now);
	values.push(id);

	database.run(
		`UPDATE passwords SET ${fields.join(', ')} WHERE id = ?`,
		values
	);

	await persistDatabase();
}

export async function deletePassword(id: string): Promise<void> {
	const database = await getDatabase();
	database.run('DELETE FROM passwords WHERE id = ?', [id]);
	await persistDatabase();
}

export async function searchPasswords(query: string): Promise<PasswordEntry[]> {
	const database = await getDatabase();
	const pattern = `%${query}%`;

	const results = database.exec(
		'SELECT id, name, url, username, encrypted_password, notes, category, created_at, updated_at FROM passwords WHERE name LIKE ? OR url LIKE ? OR username LIKE ? OR category LIKE ? ORDER BY name COLLATE NOCASE ASC',
		[pattern, pattern, pattern, pattern]
	);

	if (results.length === 0) return [];

	return results[0].values.map(mapRowToPasswordEntry);
}

// --- Helpers ---

function mapRowToPasswordEntry(row: (string | number | Uint8Array | null)[]): PasswordEntry {
	return {
		id: row[0] as string,
		name: row[1] as string,
		url: row[2] as string,
		username: row[3] as string,
		encrypted_password: row[4] as string,
		notes: row[5] as string,
		category: row[6] as string,
		created_at: row[7] as string,
		updated_at: row[8] as string
	};
}
