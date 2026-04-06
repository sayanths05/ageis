export class StorageError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = 'StorageError';
	}
}

export interface StorageBackend {
	init(): Promise<void>;
	load(): Promise<Uint8Array | null>;
	save(data: Uint8Array): Promise<void>;
	isReady(): boolean;
	needsFilePick(): boolean;
	pickNewFile(): Promise<void>;
	pickExistingFile(): Promise<void>;
	exportToFile(data: Uint8Array): Promise<void>;
	importFromFile(): Promise<Uint8Array | null>;
	supportsFilePicker(): boolean;
}

export function hasFileSystemAccess(): boolean {
	return typeof window !== 'undefined'
		&& typeof window.showSaveFilePicker === 'function';
}

let backend: StorageBackend | null = null;

export async function getStorageBackend(): Promise<StorageBackend> {
	if (backend) return backend;

	if (hasFileSystemAccess()) {
		const { FsAccessStorage } = await import('./fs-access-storage');
		backend = new FsAccessStorage();
	} else {
		const { OpfsStorage } = await import('./opfs-storage');
		backend = new OpfsStorage();
	}

	await backend.init();
	return backend;
}

export function getStorageBackendSync(): StorageBackend | null {
	return backend;
}
