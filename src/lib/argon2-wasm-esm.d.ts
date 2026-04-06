declare module 'argon2-wasm-esm' {
	interface Argon2HashResult {
		hash: Uint8Array;
		hashHex: string;
		encoded: string;
	}

	interface Argon2HashParams {
		pass: string | Uint8Array;
		salt: string | Uint8Array;
		time?: number;
		mem?: number;
		hashLen?: number;
		parallelism?: number;
		type?: number;
	}

	interface Argon2VerifyParams {
		pass: string;
		encoded: string | Uint8Array;
		type?: number;
	}

	interface Argon2 {
		ArgonType: {
			argon2d: 0;
			argon2i: 1;
			argon2id: 2;
		};
		hash(params: Argon2HashParams): Promise<Argon2HashResult>;
		verify(params: Argon2VerifyParams): Promise<void>;
	}

	const argon2: Argon2;
	export default argon2;
}
