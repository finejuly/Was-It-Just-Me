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


# Response

I followed all the instruction, but got the error from npm run tauri:dev as follows:

**npm** error Missing script: "tauri:build"

**npm** error

**npm** error To see a list of scripts, run:

**npm** error   npm run

**npm** error A complete log of this run can be found in: /Users/ilyoungjeong/.npm/_logs/2026-06-13T21_49_57_970Z-debug-0.log


# Resolution (loop #12) — RESOLVED, build green

Thanks — Rust installed cleanly (`cargo 1.96.0`, in `~/.cargo`). Two notes:

**About the `Missing script: "tauri:build"` error you hit:** that was a stale checkout / wrong
working directory, **not** a real problem. `package.json` on `main` does contain all three scripts
(`tauri`, `tauri:dev`, `tauri:build`) — loop #11 committed them. The fix is just to be on the
latest `main` and in the repo root:
```sh
cd /Users/ilyoungjeong/Documents/Wasitjustme
git pull            # if needed
npm run tauri:build # works now
```
Also: `cargo` isn't on a *non-login* shell's PATH by default — if a fresh terminal can't find it,
run `source "$HOME/.cargo/env"` (or just open a new login shell).

**What loop #12 did (all verified, committed `237d555`):**
- Generated the icon set with `tauri icon` (placeholder branded source — swap for a real logo
  anytime by re-running `npm run tauri -- icon <your.png>`).
- Fixed two bundle-time config issues: `productName` `"Was It Just Me?"` → `"Was It Just Me"` (the
  `?` is illegal in a macOS bundle name; the **window title** still shows `"Was It Just Me?"`), and
  set bundle targets to `["app"]` (the DMG step needs a GUI session — see below).
- `cargo check` clean; **`npm run tauri:build` builds `target/release/bundle/macos/Was It Just Me.app`**
  (runnable arm64 app). Web app still 61/61, core bundle untouched.

**One thing left for you (a human GUI check — can't be automated headless):**
```sh
open "src-tauri/target/release/bundle/macos/Was It Just Me.app"
```
Then confirm: the map loads in a native window; the tray menu ("I noticed something" / "Show map" /
"Quit") appears; **Cmd+Shift+Space fires exactly one signal even when the app is backgrounded**;
closing the window hides to tray (app stays alive); tray **Quit** exits. If all good, this issue is
fully closed. If you want a `.dmg` to share, run it from a normal desktop session:
`npm run tauri -- build --bundles dmg`.

> Status: the **build is verified green**; remaining work is your manual GUI smoke-test. Leaving this
> in `approved/` as the record. No further loop action is required unless the GUI test surfaces a bug.