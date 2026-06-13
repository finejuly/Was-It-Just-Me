---
id: 202606131316
title: Tauri desktop shell wrapping the existing web app (native send path)
status: done
priority: high
source: ISSUE-202606131314 (user: "Let's move to Tauri then.") + ISSUE-202606131317 (approved sub-decisions)
created: 2026-06-13
planned: 2026-06-13 (loop #11)
activated: 2026-06-13 (loop #11)
blocked_by: none for authoring; `tauri dev`/`tauri build` blocked on Rust/cargo install (ISSUE-...1318)
---

## Summary
Wrap the **existing web app verbatim** (repo root: `index.html` + `src/` + Vite) as a Tauri
desktop shell. The webview runs the unchanged privacy core, map, scrubber, demo mode, and
activity strip — **one privacy implementation, no UI fork, no second privacy code path**. The
native shell adds only what a browser tab cannot: a **system tray** and a **true OS-global
shortcut** that fire a background "I noticed something" send through the *unchanged* in-page
`sendSignal()` path.

## User decisions applied (ISSUE-...1317, approved)
1. **Rust toolchain**: user "doesn't know" → loop probed. **Rust/cargo/rustup are NOT installed**
   (`~/.cargo` absent). The loop must NOT install system tools → author everything that does not
   need cargo now; the `tauri dev`/`tauri build` step is user-gated (ISSUE-...1318).
2. **Bridge mechanism = (a) Tauri EVENT**: native emits an event; the frontend listens and calls
   the existing `sendSignal()`. Guarantees the native path is byte-for-byte the in-page path.
3. **Global shortcut = `Cmd+Shift+Space`** (`CmdOrControl+Shift+Space`), via the
   `global-shortcut` plugin.
4. **Close behavior = "keep running"** → window close **hides to tray** (app stays alive for
   background hotkey); a tray **Quit** item actually exits.
5. **Packaging = macOS only** for now (no cross-platform bundles).

## Plan

### Part A — cargo-FREE authoring (do this loop, in `loop-implement`)
All of this can be written without Rust/cargo present; nothing here runs `cargo`/`tauri`.

1. **npm devDep + scripts** (`package.json`): add `@tauri-apps/cli` (devDep) and `@tauri-apps/api`
   (dep, used by the frontend event listener). Add scripts `"tauri": "tauri"`,
   `"tauri:dev": "tauri dev"`, `"tauri:build": "tauri build"`. Do NOT run them (need cargo).
2. **`src-tauri/` project** (hand-authored, Tauri v2 layout):
   - `src-tauri/Cargo.toml` — crate `was-it-just-me`, deps: `tauri` v2 (features `tray-icon`),
     `tauri-plugin-global-shortcut` v2, `serde`/`serde_json`. `[lib]` + `[[bin]]` per v2.
   - `src-tauri/tauri.conf.json` — `build.frontendDist = "../dist"`,
     `build.devUrl = "http://localhost:5173"`, `build.beforeDevCommand = "npm run dev"`,
     `build.beforeBuildCommand = "npm run build"`. `app.windows[0]` titled "Was It Just Me?".
     `bundle.active = true`, `bundle.targets = ["app", "dmg"]` (macOS), identifier
     `ai.cochlear.wasitjustme` (or similar reverse-DNS).
   - `src-tauri/src/lib.rs` (+ thin `main.rs` calling `run()`):
     - Build the **system tray**: menu items "I noticed something", "Show map", "Quit". Tray
       "I noticed something" and the global shortcut both `emit("wijm://notice", ())` to the
       webview. "Show map" shows+focuses the main window. "Quit" calls `app.exit(0)`.
     - Register `global-shortcut` `CmdOrControl+Shift+Space` → same `emit("wijm://notice")`.
     - **Hide-to-tray**: intercept the window CloseRequested event → `prevent_close()` +
       `window.hide()` (decision #4). Quit only via tray.
   - `src-tauri/build.rs` — standard `tauri_build::build()`.
   - `src-tauri/.gitignore` — ignore `target/` and `gen/`.
   - Tray/app icons: reference an icon path; if no icon asset exists, note it as a build-time
     need (Tauri can generate placeholder icons via `tauri icon`, a cargo-gated step — leave a
     TODO rather than committing a binary asset blindly).
3. **Frontend event listener** (`src/main.ts`, in the existing `// --- Wiring ---` block):
   add a guarded listener that, **only when running inside Tauri**, subscribes to the
   `"wijm://notice"` event via `@tauri-apps/api/event`'s `listen()` and calls the **unchanged**
   `sendSignal()`. Guard on `"__TAURI_INTERNALS__" in window` (or `"isTauri"`) so the plain
   browser build is byte-for-byte unaffected and needs no Tauri runtime. Use a dynamic
   `import()` of `@tauri-apps/api/event` inside the guard so the browser bundle does not hard-depend
   on the Tauri API at load. **Add NO privacy logic** — this is a pure adapter to the existing path.
   Keep the in-page Space hotkey + Notice button exactly as-is (instant browser fallback/demo).
4. **Vite/TS**: ensure `@tauri-apps/api` types resolve under `tsc --noEmit`; keep `dist/` as the
   build output Tauri points at. No change to `vite.config.ts` expected (port 5173 already set).
5. Keep `npm test` (currently 61/61) and `npm run build` green. `build:core` bundle must stay
   byte-for-byte unchanged (it is reference-only; we are not touching the core).

### Part B — cargo-DEPENDENT build/verify (NEXT loop, after user installs Rust)
Gated on ISSUE-...1318 (Rust install). Do NOT attempt this loop:
- `npm run tauri:dev` launches the web UI in a native window.
- Tray menu present; "I noticed something" adds exactly one privacy-transformed signal.
- `Cmd+Shift+Space` fires exactly one signal while the app is backgrounded/unfocused.
- Window close hides to tray; tray Quit exits.
- `npm run tauri:build` produces a macOS bundle (`.app`/`.dmg`).
- (If needed) `tauri icon` to generate the icon set.

## Acceptance criteria
- [x] (A) `@tauri-apps/cli@2.11.2` devDep + `@tauri-apps/api@2.11.0` dep + `tauri*` scripts added;
      `npm install` ok (4 packages added).
- [x] (A) `src-tauri/` authored: `Cargo.toml`, `tauri.conf.json` (frontendDist `../dist`, devUrl
      5173, beforeDev/Build commands), `src/lib.rs` + `src/main.rs`, `build.rs`, `.gitignore`,
      `capabilities/default.json`, `README.md`. Tray menu (notice/show/quit), `global-shortcut`
      `Cmd/Ctrl+Shift+Space` (SUPER|SHIFT + Space), and hide-to-tray (prevent_close + hide on
      CloseRequested) all present in source.
- [x] (A) Tray "I noticed something" AND the global shortcut both `emit("wijm://notice")` — the
      frontend listener calls the **unchanged** `sendSignal()`. No native privacy logic (grep for
      lat/lng/jitter/bucket in `src-tauri/src/` hits only explanatory comments); record schema
      unchanged; no raw coords in the native layer.
- [x] (A) Frontend listener is Tauri-guarded (`"__TAURI_INTERNALS__" in window`) + dynamic
      `import("@tauri-apps/api/event")` (Vite code-split it into its own 1.23 kB lazy chunk, so the
      browser bundle never loads it); plain browser build/behavior unchanged (in-page Space hotkey +
      Notice button intact). **`npm test` 61/61** green; **`npm run typecheck`** clean; **`npm run
      build`** ok; **`build:core` bundle byte-for-byte unchanged** (empty `git diff --stat`).
- [x] (B, loop #12 — Rust installed, ISSUE-...1318 approved) `cargo check` **clean (0 warnings)**;
      `npm run tauri:build` produces **`target/release/bundle/macos/Was It Just Me.app`** (Mach-O
      arm64, correct Info.plist: name "Was It Just Me", id `ai.cochlear.wasitjustme`, icon embedded).
      The tray + global-shortcut + hide-to-tray wiring **compiles against the real Tauri v2 APIs**.
      Two config fixes were required (found only at `tauri build`): productName `?`→removed (macOS
      bundle names forbid `?`; window title keeps the `?`), and bundle target set to `["app"]` only.
      Icons generated via `tauri icon` (placeholder source). **Remaining human step**: live
      click-test the tray/`Cmd+Shift+Space`/close-to-tray in a GUI session (can't be done headless);
      DMG also needs a GUI session (`tauri build --bundles dmg`).

## Outcome (loop #11)
Part A (all cargo-free authoring) **complete and verified** — see checked items above. Part B is
the only remaining work and is **gated on the Rust toolchain**, which is not installed on this
machine; raised as **ISSUE-...1318** (one-line rustup install + `npm run tauri:dev`). Committed
small on `main` (no push). Marking this task **done for the authoring scope**; the build/verify
step continues under ISSUE-...1318 next loop.

## Outcome (loop #12) — Part B done
User installed Rust (`cargo 1.96.0`) and approved **ISSUE-...1318**, unblocking Part B. This loop:
- `tauri icon` generated the app icon set (placeholder branded source — swap for a real logo later).
- `cargo check` in `src-tauri/` → **clean, 0 warnings**; the tray/global-shortcut/hide-to-tray code
  compiles against the real Tauri v2.11.2 + `tauri-plugin-global-shortcut` v2.3.2 + `tray-icon`
  v0.23.1 APIs (the wiring is sound, not just hand-authored).
- `npm run tauri:build` → built **`Was It Just Me.app`** (Mach-O arm64). Two config defects that
  only surface at bundle time were fixed: `productName` had a `?` (forbidden in macOS bundle names)
  and DMG bundling fails headless, so default targets are now `["app"]`.
- Web app unaffected: **tests 61/61**, typecheck clean, core bundle byte-for-byte unchanged.
- Committed `237d555` (config fix + icons), no push.
**Task fully done.** Only the human-in-the-loop GUI verification remains (run the `.app`, confirm
tray + `Cmd+Shift+Space` fire one signal backgrounded, close→tray, Quit exits) — tracked as the
acceptance note on ISSUE-...1318, not a blocker for the build itself.

## Test notes
- This loop verifies only Part A (no cargo): `npm run typecheck`, `npm test`, `npm run build`,
  and a `git diff --stat` on `native/WIJMCore/.../wijm-core.js` to confirm the core bundle is
  untouched. Part B verification happens next loop once Rust is installed.
- Privacy: confirm `src-tauri/src/lib.rs` contains NO latitude/longitude/jitter/bucket logic — it
  only emits a fire-event; all privacy stays in the unchanged web `transformSignal`/`SignalStore`.

## Notes
- Tauri **v2** (current). Plugin: `tauri-plugin-global-shortcut` (v2) + the `tray-icon` feature.
- The closed Swift bridge (`native/WIJMCore/`) stays in-tree as a reference artifact only.
- Do NOT push; orchestrator commits small on `main`.
