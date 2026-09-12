# MinSync

MinSync is an Electron desktop app for incremental Android backups over ADB. It also includes Quick Share for transferring files between a computer and a phone on the same network.

## Development

Requirements:

- Node.js 22 or newer
- Linux, macOS, or Windows

Install dependencies and start the development app:

```bash
npm install
npm run dev
```

`npm install` downloads the platform-specific Android Platform Tools into `bin/`. The app uses this bundled ADB first and falls back to an `adb` executable available on `PATH`.

Build the renderer only:

```bash
npm run build
```

## Linux Packaging

Build Linux installers locally with:

```bash
npm install
npm run dist:linux
```

The generated AppImage and Debian package are written to `release/`. These generated files should not be committed to the repository.

The Linux package includes the ADB executable downloaded during installation. Linux users may still need Android udev rules for USB device access. ADB from the system `PATH` is used as a fallback.

## GitHub Releases

Releases are built by GitHub Actions when a version tag is pushed. Ordinary commits and pushes to `main` do not create releases.

Create a release after committing and pushing the changes:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Tags must use the `vMAJOR.MINOR.PATCH` format, such as `v1.0.0` or `v1.0.1`. The workflow builds the exact commit referenced by the tag and uploads the Linux AppImage and `.deb` package to the corresponding GitHub Release.

Use a new tag for every release. For example, use `v1.0.1` for a release containing fixes after `v1.0.0`; do not reuse or move an existing release tag.
