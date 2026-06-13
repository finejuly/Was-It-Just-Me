---
id: 202606131318
title: Install the Rust toolchain so the Tauri desktop shell can build/run
status: pending
type: action / blocker
created: 2026-06-13
raised_by: loop-orchestrate (loop #11)
relates_to: ISSUE-202606131317 (Tauri sub-decisions — you answered "I don't know" on Rust),
  TASK-202606131316 (Tauri shell — authored this loop)
blocks: `tauri dev` / `tauri build` (Part B of TASK-...1316) — the live native demo
---

## Context
On ISSUE-...1317 you answered **"I don't know"** about whether Rust is installed. The loop
probed your machine: **`rustc` / `cargo` / `rustup` are all absent** (no `~/.cargo`). Per the
agreed protocol, the loop does **not** install system toolchains for you — so this loop wrote
**all of the Tauri code that does not need Rust** and is now pausing the build until you install it.

## What's already done (loop #11, no Rust needed) — committed
- `src-tauri/` Tauri **v2** project authored: tray menu (*I noticed something* / *Show map* /
  *Quit*), OS-global shortcut **Cmd/Ctrl+Shift+Space**, **hide-to-tray on close** (Quit exits) —
  exactly your ISSUE-...1317 decisions. The native layer has **no location/privacy logic**.
- Frontend bridge: when running inside Tauri, the app listens for a `wijm://notice` event and
  calls the **unchanged** `sendSignal()` — byte-for-byte the in-page Space-hotkey path. The plain
  browser app is unaffected (the Tauri API is code-split into a lazy chunk, loaded only in Tauri).
- npm: added `@tauri-apps/cli` + `@tauri-apps/api` and `tauri` / `tauri:dev` / `tauri:build`
  scripts. Web app still green: **tests 61/61**, typecheck clean, build ok, core bundle unchanged.

## What I need from you (one-time, ~2 min)
**1) Install Rust** (user-level; no `sudo`):
```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
Accept the default install, then **restart your terminal** (or `source "$HOME/.cargo/env"`).
Verify with `cargo --version`.

**2) (Optional, recommended) macOS build prerequisites** — Tauri uses the system WebView, so on
macOS you mainly need Xcode Command Line Tools (likely already present): `xcode-select --install`.

**3) Then the next loop can run the native shell:**
```sh
npm install
npm run tauri:dev     # web UI in a native window, with tray + global hotkey
```
(First `tauri dev` compiles the Rust deps — a few minutes once.) A macOS bundle is
`npm run tauri:build` (produces `.app` / `.dmg`).

> Note: `tauri.conf.json` references `icons/*` but no binary icon assets are committed. After Rust
> is installed, the next loop can generate them with `npm run tauri -- icon <some.png>`; until then
> `tauri build` may warn/fail on missing icons (dev run is fine). Flag if you have a logo to use.

## How to answer
- If you've installed Rust: move this to `Issues/approved/` with a note (e.g. "Rust installed,
  cargo X.Y") — next loop runs `tauri dev`, verifies tray + global hotkey + close-to-tray, and
  builds the macOS bundle (closing out Part B of TASK-...1316).
- If you'd rather **not** install Rust right now: move to `Issues/rejected/` (or note it) — the web
  app remains the full live demo (the Tauri code stays in-tree, ready for whenever you install Rust).
