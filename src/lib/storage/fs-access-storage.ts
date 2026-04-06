import { StorageError, type StorageBackend } from './storage';

const DB_FILENAME = 'aegis.db';
const IDB_NAME = 'aegis-meta';
const IDB_STORE = 'file-handles';
const IDB_KEY = 'db-handle';

export class FsAccessStorage implements StorageBackend {
	private fileHandle: FileSystemFileHandle | null = null;

	async init(): Promise<void> {
		await this.tryRestore();
	}

	async load(): Promise<Uint8Array | null> {
		if (!this.fileHandle) return null;

		try {
			const file = await this.fileHandle.getFile();

			if (file.size === 0) return null;

			const buffer = await file.arrayBuffer();
			return new Uint8Array(buffer);
		} catch (error) {
			throw new StorageError('Failed to read database file', error);
		}
	}

	async save(data: Uint8Array): Promise<void> {
		if (!this.fileHandle) {
			throw new StorageError('No file handle. Pick a file first.');
		}

		try {
			const writable = await this.fileHandle.createWritable();
			await writable.write(data.buffer as ArrayBuffer);
			await writable.close();
		} catch (error) {
			throw new StorageError('Failed to write database file', error);
		}
	}

	isReady(): boolean {
		return this.fileHandle !== null;
	}

	needsFilePick(): boolean {
		return this.fileHandle === null;
	}

	async pickNewFile(): Promise<void> {
		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: DB_FILENAME,
				types: [
					{
						description: 'Aegis Database',
						accept: { 'application/octet-stream': ['.db'] }
					}
				]
			});

			this.fileHandle = handle;
			await this.saveHandle(handle);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			throw new StorageError('Failed to create database file', error);
		}
	}

	async pickExistingFile(): Promise<void> {
		try {
			const [handle] = await window.showOpenFilePicker({
				types: [
					{
						description: 'Aegis Database',
						accept: { 'application/octet-stream': ['.db'] }
					}
				]
			});

			this.fileHandle = handle;
			await this.saveHandle(handle);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			throw new StorageError('Failed to open database file', error);
		}
	}

	async exportToFile(): Promise<void> {
		// No-op: file is already on disk
	}

	async importFromFile(): Promise<Uint8Array | null> {
		// Not needed for FS Access — use pickExistingFile instead
		return null;
	}

	supportsFilePicker(): boolean {
		return true;
	}

	// --- IndexedDB handle persistence ---

	private metaDb: IDBDatabase | null = null;

	private async tryRestore(): Promise<void> {
		try {
			const stored = await this.loadHandle();

			if (!stored) return;

			const permission = await stored.requestPermission({ mode: 'readwrite' });

			if (permission !== 'granted') return;

			this.fileHandle = stored;
		} catch {
			// Handle expired or invalid — user will need to pick again
		}
	}

	private async getMetaDb(): Promise<IDBDatabase> {
		if (this.metaDb) return this.metaDb;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(IDB_NAME, 1);

			request.onupgradeneeded = () => {
				request.result.createObjectStore(IDB_STORE);
			};

			request.onsuccess = () => {
				this.metaDb = request.result;
				resolve(this.metaDb);
			};

			request.onerror = () => reject(request.error);
		});
	}

	private async saveHandle(handle: FileSystemFileHandle): Promise<void> {
		const db = await this.getMetaDb();

		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	private async loadHandle(): Promise<FileSystemFileHandle | null> {
		const db = await this.getMetaDb();

		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readonly');
			const request = tx.objectStore(IDB_STORE).get(IDB_KEY);
			request.onsuccess = () => resolve(request.result ?? null);
			request.onerror = () => reject(request.error);
		});
	}
}
