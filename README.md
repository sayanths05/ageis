# Aegis

A local password vault that runs entirely in the browser. No server, no cloud, no account. Your passwords never leave your device.

## Why Aegis?

Most password managers require trusting a cloud provider with your most sensitive data. Aegis takes a different approach: everything happens client-side. Your vault is an encrypted file on your machine, unlocked with a master password that's never stored or transmitted.

## Features

- **Fully offline** — works without internet after first load
- **AES-256-GCM encryption** — military-grade encryption via Web Crypto API
- **Argon2id key derivation** — memory-hard KDF resistant to GPU/ASIC attacks
- **Password generator** — configurable length, character types, and allowed symbols
- **Password strength indicator** — real-time feedback as you type
- **Auto-lock** — vault locks after 5 minutes of inactivity
- **Search and filter** — find passwords by name, username, URL, or category
- **Sort** — alphabetical, recently updated, or newest first
- **Cross-browser** — Chromium (native file access) and Firefox/Safari (OPFS with export/import)
- **Static SPA** — deploy anywhere (GitHub Pages, Netlify, S3, or just open `index.html`)

## Quick Start

```bash
# Install dependencies
bun install

# Copy WASM binary (first time only)
cp node_modules/sql.js/dist/sql-wasm.wasm static/

# Start dev server
bun run dev
```

Open `http://localhost:5173` and create your vault.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with HMR |
| `bun run build` | Production build (static SPA) |
| `bun run preview` | Preview production build |
| `bun run check` | Type check |
| `bun run check:watch` | Type check in watch mode |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Styling | Tailwind CSS 4 |
| Database | SQLite via sql.js (WASM, in-memory) |
| Crypto | Argon2id (argon2-wasm-esm) + AES-256-GCM (Web Crypto API) |
| IDs | UUIDv7 (time-sortable) |
| Icons | Lucide Svelte |
| Build | Vite 7 + adapter-static |

## Security Model

### Encryption

Every sensitive field (passwords, notes) is encrypted individually with **AES-256-GCM**. Each encryption operation uses a unique 12-byte random IV.

### Key Derivation

Your master password is never stored. Instead, two separate keys are derived using **Argon2id** (19 MiB memory, 2 iterations):

1. **Verification hash** — derived with `salt_v`, stored in the vault to verify your password on unlock
2. **Encryption key** — derived with `salt_e`, used to encrypt/decrypt your data. Held in memory only.

### What's stored vs. what's in memory

| Data | Storage | Lifetime |
|------|---------|----------|
| Encrypted passwords/notes | SQLite file | Persistent |
| Verification hash + salts | SQLite file | Persistent |
| Encryption key (CryptoKey) | Memory | Session only |
| Master password | Nowhere | Never stored |

Refreshing the page clears the session. Re-authentication is always required.

## Storage Backends

Aegis adapts to the browser's capabilities:

### Chromium (Chrome, Edge, Brave)

Uses the **File System Access API** to read/write a real `.db` file on disk. You pick where it lives. Changes are saved directly to the file.

> **Brave users**: File System Access API is blocked by default. Enable it at `brave://flags/#file-system-access-api`.

### Firefox & Safari

Uses the **Origin Private File System (OPFS)** — a sandboxed browser storage. Since there's no direct file access, Aegis provides **Export** and **Import** buttons to back up and restore your vault manually.

## Deployment

Aegis builds to a static SPA. Deploy the `build/` directory to any static host.

```bash
bun run build
```

No server, no environment variables, no configuration. Just static files.

## License

MIT
