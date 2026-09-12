# MinSync — Agent guide

## Project structure

```
main.js                  Electron main process (CommonJS)
preload.js               contextBridge to expose window.api
renderer/                Vite + React + Tailwind CSS v4 app
  index.html             Vite entry HTML
  db.js                  IndexedDB persistence (config + sync history)
  src/
    main.jsx             React entry
    App.jsx              Root component (Backup + Quick Share tabs)
    qrcode.js            Vendored QR code generator (Kazuhiko Arase)
    components/          UI components
scripts/download-adb.js  Postinstall: downloads ADB to bin/
```

## Commands

You do not have access to the npm environment, do not attempt to install packages, prompt the use to instead.

| Command | Action |
|---------|--------|
| `npm run dev` | Start Vite dev server + Electron (concurrently + wait-on) |
| `npm start` | Run Electron in production mode (loads `dist-renderer/`) |
| `npm run build` | Vite build to `dist-renderer/` |
| `npm run preview` | Vite preview of built renderer |

Postinstall (`npm install`) downloads ADB to `bin/adb`. `bin/` is gitignored.

## Architecture

- **Main process** (`main.js`): All ADB operations via `child_process.exec`, Quick Share via raw `http.createServer` (no Express). IPC handlers prefixed `adb:*`, `share:*`, `dialog:*`, `files:*`.
- **Preload** (`preload.js`): Exposes `window.api` with namespaced methods (`api.wifi.*`, `api.share.*`). No `nodeIntegration`, `contextIsolation: true`.
- **Renderer**: React 18 + Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no PostCSS config). Dark mode via `<html class="dark">`.
- **Quick Share**: Plain HTTP server on `0.0.0.0` serving a mobile web UI. Upload/download files with path traversal protection (`safeJoin`). QR code generated client-side.

## Key patterns

- **IPC naming**: `adb:*` for device ops, `share:*` for Quick Share, `dialog:*` for native dialogs, `files:*` for PC file comparison.
- **ADB helpers**: `adb()` runs a command, `safeAdb()` swallows errors, `adbShell()` wraps `adb -s <id> shell`, `runAdbSpawn()` used for interactive commands (pair/connect with timeout + stdin).
- **ADB WiFi**: Pairing flow is `pair` → `mdns scan` → `connect`. Port changes on reboot; reconnect requires fresh mDNS scan.
- **Scan/sync flow**: `adb:tree` (list folders up to 4 levels deep) → `adb:scan` (recursive `ls -lR`) → `files:checkPC` (compare name+size against local filesystem) → `adb:pull` missing files to `{dest}/{deviceName}-inbox/`.
- **Sync after WiFi backup**: WiFi is automatically disconnected when sync completes (`App.jsx:184-189`).

## Gotchas

- Tailwind CSS v4: no `tailwind.config.js`, no `@tailwind base/components/utilities`. Use `@tailwindcss/vite` plugin only.
- No linter, typechecker, or test infrastructure exists.
- `renderer/db.js` uses IndexedDB via a class wrapper (`SyncDB`). Schema upgrades happen in `onupgradeneeded`.
- QR code is the vendored `renderer/src/qrcode.js` (not a package dependency). Used via `qrcode(0, 'M')` API.
- `@headlessui/react` v2 is a dependency but not yet imported in any component.

## UI Rules
- Always use one of the 4 button css classes for button styling: btn-primary, btn-secondary, btn-action, btn-danger
