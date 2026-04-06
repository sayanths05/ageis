interface FileSystemFileHandle {
	requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
}

interface Window {
	showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
	showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
}

interface SaveFilePickerOptions {
	suggestedName?: string;
	types?: FilePickerAcceptType[];
	excludeAcceptAllOption?: boolean;
}

interface OpenFilePickerOptions {
	multiple?: boolean;
	types?: FilePickerAcceptType[];
	excludeAcceptAllOption?: boolean;
}

interface FilePickerAcceptType {
	description?: string;
	accept: Record<string, string[]>;
}
