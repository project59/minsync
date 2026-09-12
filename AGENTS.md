# MinSync AI contributor guide

Use this file as the fast path for understanding and changing the project. Read the relevant source before editing; keep changes focused and preserve the existing Electron security boundary and UI style.

## What this app is

MinSync is an Electron desktop app for incremental Android backups over ADB and local file sharing between a computer and phone. It supports Linux, macOS, and Windows.

## Repository map

```text
main.js                         Electron main process, ADB and Quick Share server
preload.js                      contextBridge; the renderer's only native API
package.json                    scripts, dependencies, Electron Builder config
electron-builder.win.yml        Windows packaging overrides
scripts/download-adb.js         postinstall download of platform-specific ADB
renderer/index.html             Vite HTML entry point
renderer/src/main.jsx           React entry point
renderer/src/App.jsx            routing, device state, backup orchestration
renderer/src/pages/              Home, Backup, Quick Share, Support, FAQ pages
renderer/src/components/         reusable React UI and backup/share components
renderer/src/index.css           Tailwind v4 import, theme, shared components
renderer/db.js                  IndexedDB wrapper for config and sync history
renderer/src/qrcode.js           vendored QR generator; do not replace casually
.github/workflows/               tag-triggered cross-platform release workflow
```

Generated or downloaded directories are ignored and should not be edited or committed: `node_modules/`, `bin/`, `dist-renderer/`, and `release/`.

## Development

Requirements: Node.js 22 or newer and a Linux, macOS, or Windows development machine.

```bash
npm install       # also downloads bundled ADB into bin/
npm run dev       # starts Vite and Electron with --dev
```

Other scripts:

| Command | Purpose |
|---|---|
| `npm start` | Run Electron against the existing production build |
| `npm run build` | Build the renderer into `dist-renderer/` |
| `npm run preview` | Preview the Vite renderer build |
| `npm run dist:linux` | Build Linux AppImage and Debian packages |
| `npm run dist:mac` | Build macOS DMG and ZIP packages |
| `npm run dist:win` | Build Windows NSIS installer and portable executable |

There is currently no test runner, linter, or typechecker. For UI or runtime changes, run `npm run build`; use `npm run dev` for manual verification when practical.

## Runtime architecture

- `main.js` runs with CommonJS in the Electron main process. It creates the window, locates ADB, runs ADB commands, handles native dialogs/files, and owns the Quick Share HTTP server.
- `preload.js` runs with `contextIsolation: true` and `nodeIntegration: false`. Add native functionality here as a narrow `window.api` method, then implement its matching `ipcMain.handle` in `main.js`.
- The renderer is React 18 with Vite and Tailwind CSS v4. Development loads `http://localhost:5173`; packaged mode loads `dist-renderer/index.html`.
- ADB resolution prefers `bin/adb` or packaged resources, then falls back to `adb` on `PATH`. Do not hard-code a platform-specific ADB path.
- Quick Share is a raw Node `http.createServer` bound to `0.0.0.0`; it serves a phone-friendly HTML page and upload/download endpoints. Keep `safeJoin` protection for every user-controlled file path.

## IPC and data flows

IPC channels use these prefixes:

- `adb:*`: status, folder tree, recursive scan, pull, preview, version, and ADB re-download
- `adb:wifi:*`: mDNS discovery, wireless pairing, connect, and disconnect
- `dialog:*`: native folder selection
- `files:*`: open local files/folders and compare phone files with the destination
- `share:*`: start/stop/status, folder selection, shared files, and share events

Backup flow:

1. `adb:status` finds a connected USB or Wi-Fi device.
2. `adb:tree` loads selectable phone folders.
3. `adb:scan` lists selected files.
4. `files:checkPC` compares phone paths and sizes with the chosen local destination.
5. `adb:pull` copies only missing files into `{destination}/{device-model}-inbox/`.
6. Sync history and saved settings are stored in IndexedDB through `renderer/db.js`.

Wi-Fi ADB pairing is `pair` -> fresh `mdns scan` -> `connect`. The phone's connection port can change after reboot, so reconnect must scan again.

## Implementation conventions

- Keep native Node/Electron access in `main.js` and expose only the minimum required API through `preload.js`.
- Keep renderer components in `renderer/src/`; use the existing hash routes in `App.jsx` for new top-level pages.
- Tailwind v4 uses `@tailwindcss/vite` and `@import "tailwindcss"` in `renderer/src/index.css`. Do not add a Tailwind config or legacy `@tailwind base/components/utilities` directives.
- Use the shared button classes `btn-primary`, `btn-secondary`, `btn-action`, or `btn-danger`; do not create one-off button styles.
- Follow the existing taupe/blue/action/danger theme, dark-mode classes, responsive layout, and Lucide icon usage.
- `@headlessui/react` v2 is available for accessible dialogs and tabs.
- `renderer/db.js` uses IndexedDB schema version 1. Schema changes require an `onupgradeneeded` migration and careful handling of existing user data.
- `renderer/src/qrcode.js` is vendored code used by Quick Share. Avoid modifying it unless the QR implementation itself needs fixing.

## Safety and security

- Treat all phone, network, filename, and local path values as untrusted input.
- Preserve path traversal protection in Quick Share and validate paths before filesystem operations.
- Do not expose Node modules, `ipcRenderer`, or broad filesystem primitives directly to the renderer.
- Avoid logging pairing codes, file contents, or sensitive local paths unnecessarily.
- Quick Share is local-network functionality, not an authenticated public file server. Do not broaden its network exposure without an explicit security decision.

## Releases

`.github/workflows/release-linux.yml` runs on tags matching `v*.*.*`, sets the package version from the tag, installs dependencies/ADB, and publishes Linux, macOS, and Windows artifacts sequentially. Use a new `vMAJOR.MINOR.PATCH` tag for each release; do not move or reuse an existing tag.

Local packaging writes artifacts to `release/`. macOS packages are currently unsigned and unnotarized. Windows builds produce both NSIS and portable targets; the portable executable is the preferred public download.
