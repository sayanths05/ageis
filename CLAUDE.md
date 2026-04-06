# Aegis

A local password vault. Runs entirely in the browser — no server, no cloud.

## Build & Test

- `bun run dev` — start dev server
- `bun run check` — type check (run after code changes)
- `bun run build` — production build (static SPA)
- If `static/sql-wasm.wasm` is missing: `cp node_modules/sql.js/dist/sql-wasm.wasm static/`

## Code Style

- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
- Use `onMount` for side effects on component init — not `$effect`
- Use `Promise.all` for independent async operations
- Debounce user input that triggers DB queries (200ms)
- All crypto stays client-side — never send plaintext to any backend
- Monochrome white UI — no color branding. Only color comes from avatar circles and category dots.

## Design Language

### Containers
- **Form groups**: `bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden` — stacked inputs inside with `border-t border-slate-800/60` dividers
- **List items**: No card borders. Flat rows with `border-b border-slate-800/40` dividers. `hover:bg-slate-800/30`.
- **Modals**: `bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xl` over `bg-black/60 backdrop-blur-sm`

### Inputs
- Inside containers: `w-full px-4 py-3.5 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none focus:bg-slate-800/30 transition-colors`
- Standalone (search, auth forms): `bg-slate-900/50 border border-slate-800/60 rounded-xl`

### Buttons
- **Primary (CTA)**: `bg-white hover:bg-slate-200 text-slate-950 font-medium rounded-lg`
- **Ghost/icon**: `p-2 text-slate-500 hover:text-slate-300 transition-colors` — no bg, no border
- **Text action**: `text-sm text-slate-500 hover:text-slate-300 transition-colors` (e.g. Edit, Generate)
- **Destructive**: `hover:text-red-400` on ghost icons, `bg-red-600 text-white` for confirm buttons
- **Filter pills**: `px-3 py-1.5 rounded-full text-sm` — active: `bg-slate-700 text-slate-100`, inactive: `bg-slate-900/50 text-slate-500`

### Text Hierarchy
- **Page title**: `text-2xl font-semibold text-slate-100`
- **Form/modal title**: `text-lg font-semibold text-slate-100`
- **Section label**: `text-xs font-medium text-slate-500 tracking-wide uppercase`
- **Primary text**: `text-slate-100`
- **Secondary text**: `text-sm text-slate-500`
- **Helper/hint text**: `text-[10px] text-slate-600` — hidden by default, reveal on hover via `opacity-0 group-hover:opacity-100`

### Layout
- Detail/form views: `max-w-lg mx-auto px-6 py-10`
- List view: `max-w-2xl mx-auto px-6 py-6`
- Header: `max-w-4xl mx-auto px-4 py-4`

### Transitions
- Button press: `scale(0.97)` at `100ms`
- Hover states: `transition-colors`
- Page transitions: `fly` at `150-200ms`
- Strength border: `transition-colors duration-300`

### Patterns
- **Navigation header**: Back arrow (ghost, left) — Title (center) — Actions (right)
- **Credential rows**: Full-width button, tap to copy, label + value + hover hint
- **Avatar**: `rounded-full` with hash-based palette color, initial letter. Favicon from URL when available, fallback to letter.
- **Category dot**: `w-1.5 h-1.5 rounded-full` with palette color
- **Password strength**: Border color on container (red/amber/blue/emerald) + small right-aligned label
- **Empty states**: Centered text, muted icon at `opacity-40`
- **Error messages**: `bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm` with `fly` animation

## Architecture

- Client-only SPA: SvelteKit + adapter-static, `ssr = false`
- SQLite via sql.js (WASM, in-memory), sql module is cached across DB cycles
- Crypto: Argon2id (19MiB, 2 iter) for KDF + AES-256-GCM via Web Crypto API
- Two separate Argon2 derivations: one for verification hash, one for encryption key
- Storage: unified `StorageBackend` interface (`src/lib/storage/`)
  - `FsAccessStorage` — Chromium: real file via File System Access API
  - `OpfsStorage` — Firefox/Safari: OPFS with manual export/import
- Session key (CryptoKey) held in memory only — never persisted. Re-auth required on refresh.

## Routing

- `/` — auth gate (FilePicker, SetupForm, LoginForm). Redirects to `/passwords` on unlock.
- `/passwords` — password list. Auth guard in layout redirects to `/` if not unlocked.
- `/passwords/add` — add new password
- `/passwords/[id]` — view password (decrypts on load)
- `/passwords/[id]/edit` — edit password
- Shared layout at `/passwords/+layout.svelte` handles header, auth guard, activity tracking.

## Gotchas

- sql.js WASM must be aliased in `vite.config.ts` (`sql.js` → `sql.js/dist/sql-wasm.js`) to avoid CJS/ESM mismatch
- Brave blocks File System Access API by default — enable at `brave://flags/#file-system-access-api`
- Dynamic SQL column names in `updatePassword` must be in `VALID_PASSWORD_COLUMNS` whitelist
- Activity handler for auto-lock is throttled to 30s to avoid excessive timer resets
