import { StorageError, type StorageBackend } from './storage';

const DB_FILENAME = 'aegis.db';
const EXPORT_FILENAME = 'aegis-backup.db';

export class OpfsStorage implements StorageBackend {
	private ready = false;
	private cachedHandle: FileSystemFileHandle | null = null;

	async init(): Promise<void> {
		this.ready = true;
	}

	async load(): Promise<Uint8Array | null> {
		try {
			const handle = await this.getFileHandle();
			const file = await handle.getFile();

			if (file.size === 0) return null;

			const buffer = await file.arrayBuffer();
			return new Uint8Array(buffer);
		} catch (error) {
			throw new StorageError('Failed to load database from OPFS', error);
		}
	}

	async save(data: Uint8Array): Promise<void> {
		try {
			const handle = await this.getFileHandle();
			const writable = await handle.createWritable();
			await writable.write(data.buffer as ArrayBuffer);
			await writable.close();
		} catch (error) {
			throw new StorageError('Failed to save database to OPFS', error);
		}
	}

	isReady(): boolean {
		return this.ready;
	}

	needsFilePick(): boolean {
		return false;
	}

	async pickNewFile(): Promise<void> {
		// No-op: OPFS doesn't need file picking
	}

	async pickExistingFile(): Promise<void> {
		// No-op: use importFromFile instead
	}

	async exportToFile(data: Uint8Array): Promise<void> {
		const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = EXPORT_FILENAME;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		URL.revokeObjectURL(url);
	}

	async importFromFile(): Promise<Uint8Array | null> {
		return new Promise((resolve) => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.db';

			input.onchange = async () => {
				const file = input.files?.[0];

				if (!file) {
					resolve(null);
					return;
				}

				const buffer = await file.arrayBuffer();
				const data = new Uint8Array(buffer);

				await this.save(data);
				resolve(data);
			};

			input.oncancel = () => resolve(null);
			input.click();
		});
	}

	supportsFilePicker(): boolean {
		return false;
	}

	private async getFileHandle(): Promise<FileSystemFileHandle> {
		if (this.cachedHandle) return this.cachedHandle;

		const root = await navigator.storage.getDirectory();
		this.cachedHandle = await root.getFileHandle(DB_FILENAME, { create: true });

		return this.cachedHandle;
	}
}
