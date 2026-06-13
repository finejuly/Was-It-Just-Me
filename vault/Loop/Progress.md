# Progress

_Last updated: 2026-06-13 (loop #12)_

## Status
**The Tauri native desktop shell now builds.** The user installed Rust (`cargo 1.96.0`) and approved
**ISSUE-...1318**, which unblocked **Part B of TASK-...1316** (the cargo-dependent build/verify). This
loop ran it: `cargo check` is **clean (0 warnings)** and `npm run tauri:build` produces a runnable
macOS **`Was It Just Me.app`**. The web app remains the live-demo spine (tests **61/61**), and the
native layer still has **zero location/privacy logic** — one privacy core, wrapped verbatim.

- **Tauri Part B verified (committed `237d555`):**
  - `tauri icon` generated the app icon set (placeholder branded source — `npm run tauri -- icon <png>`
    to swap in a real logo). Committed the macOS-referenced icons (32/128/128@2x/icns) + root set;
    dropped the android/ios variants (macOS-only packaging).
  - **Two bundle-time config defects found & fixed** (only surface at `tauri build`, not `cargo check`):
    `productName` `"Was It Just Me?"` → `"Was It Just Me"` (macOS bundle names forbid `?`; the **window
    title** keeps the `?`), and `bundle.targets` → `["app"]` (DMG bundling fails headless — needs a GUI
    session via `tauri build --bundles dmg`).
  - **`cargo check` clean**; the tray / global-shortcut `Cmd+Shift+Space` / hide-to-tray wiring
    compiles against the real **Tauri v2.11.2** + `tauri-plugin-global-shortcut v2.3.2` + `tray-icon
    v0.23.1` APIs. `npm run tauri:build` → **`src-tauri/target/release/bundle/macos/Was It Just Me.app`**
    (Mach-O **arm64**, Info.plist name "Was It Just Me", id `ai.cochlear.wasitjustme`, icon embedded).
  - Web app unaffected: **tests 61/61**, typecheck clean, **core bundle (`wijm-core.js`) byte-for-byte
    unchanged**. TASK-...1316 Part B criterion checked → task fully done.
- **User's "Missing script: tauri:build" error was stale**, not a defect: `package.json` on `main`
  has all three `tauri*` scripts (added loop #11). Resolved with a note on ISSUE-...1318 (be on latest
  `main`, run from repo root; `source ~/.cargo/env` if a fresh shell can't find cargo).

## Snapshot
- Tasks: candidates 0 · ready 0 · active 0 · done 9 (TASK-...1316 **Part A + Part B done**)
- Issues: pending **0** · approved 6 (ISSUE-...1318 **resolved/green**, kept in approved/ as record) · rejected 2
- Reviews: 0 pending (5 processed)
- App: web app builds; `npm run dev` → http://localhost:5173/ ; **tests 61/61**. **Native macOS `.app`
  builds** via `npm run tauri:build`. `build:core` reference bundle unchanged.
- Issue gate: **0/10 — clear**. Config: refresh_minutes=1, unanswered_issue_limit=10.

## Now / Next
- **User (one manual GUI smoke-test, not a blocker)**: `open "src-tauri/target/release/bundle/macos/Was
  It Just Me.app"` and confirm: map loads in a native window; tray menu present; **Cmd+Shift+Space fires
  exactly one signal while backgrounded**; window close hides to tray; tray **Quit** exits. (Live
  tray/hotkey behavior can't be auto-verified headless — the build is green; this is the human check.)
  If you want a shareable `.dmg`: `npm run tauri -- build --bundles dmg` from a normal desktop session.
- **Loop #13 (default, since pending=0 and Tauri is built)**: advance **GOAL #6 / M6 — demo polish**
  on the web spine (demo-facing copy, the reassuring "was it just me?" framing, reliability/UX), since
  the web app is the live demo the Tauri shell wraps. Optionally: replace the placeholder app icon with
  a real logo if the user provides one; consider a short demo script/runbook.
- **User live-test (web app, the demo spine)**: http://localhost:5173/ — Demo mode → activity strip
  under the scrubber; click a bar / drag to scrub; Play history (2×/4×); Back to live; Density;
  Verification mode (off by default). Browser Space hotkey + Notice button unchanged.

## Blocked
- **Nothing build-blocking.** The only open item is the human GUI smoke-test of the native `.app`
  (above) — informational, not a loop blocker.
- **DMG** is intentionally off by default (headless bundler limitation); produce on demand in a GUI session.
- **App icon is a placeholder** (generated from a synthetic source) — swap for a real logo via
  `tauri icon` whenever one is available.

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it. Config is
`refresh_minutes=1`. A fixed-interval cron is more robust within a running session — switchable on request.
