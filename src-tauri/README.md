# Was It Just Me? — Tauri desktop shell

A thin **Tauri v2** native host that wraps the existing web app (`../index.html` + `../src/`,
built by Vite to `../dist`). It adds only what a browser tab cannot:

- a **system tray** (menu: *I noticed something* · *Show map* · *Quit*), and
- a **true OS-global shortcut** — `Cmd/Ctrl+Shift+Space` — that fires a background signal.

## Privacy: one implementation, in the web layer

This Rust crate has **no location data and no privacy logic**. The tray item and the global
shortcut only `emit("wijm://notice")`; the unchanged web `sendSignal()` path (in `src/main.ts`)
runs `transformSignal` (jitter + bucketing) and `SignalStore.add` — byte-for-byte the same path
as the in-page Space hotkey. There is no second privacy code path and no JSC bridge.

## Status

The source is authored and committed, but **it has not been built yet**: building Tauri needs
the Rust toolchain (`rustup`/`cargo`), which is not installed on the current machine.

### To build/run (one-time Rust install, then dev)

```sh
# 1) Install Rust (one line; safe, user-level — does not need sudo):
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# then restart your shell (or: source "$HOME/.cargo/env")

# 2) From the repo root:
npm install            # pulls @tauri-apps/cli + @tauri-apps/api
npm run tauri:dev      # launches the web UI in a native window (Vite dev server)
npm run tauri:build    # produces a macOS .app/.dmg bundle
```

## Icons (build-time TODO)

`tauri.conf.json` references `icons/*`. No binary icon assets are committed yet. After Rust is
installed, generate a placeholder set from any square PNG with:

```sh
npm run tauri -- icon path/to/logo.png
```

This writes `src-tauri/icons/`. (Left as a build step rather than committing an unreviewed binary.)

## User decisions encoded (ISSUE-202606131317)

- Bridge = Tauri **event** → frontend `sendSignal()`.
- Global shortcut = **Cmd/Ctrl+Shift+Space**.
- Window close = **hide to tray** (keep running); **Quit** from the tray exits.
- Packaging = **macOS only** for now (`bundle.targets: ["app", "dmg"]`).
