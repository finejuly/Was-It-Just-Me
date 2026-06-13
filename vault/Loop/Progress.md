# Progress

_Last updated: 2026-06-13 (loop #13)_

## Status
**Fixed a real native-app launch crash.** The user ran the built `.app` and it
**crashed on launch** (`Reviews/Review 6.md`: `SIGABRT`/`abort()` on the main thread,
~2s in, on macOS **26.3.1**). Root-cause analysis pointed at two compounding causes:
the release profile's `panic = "abort"` turned any startup Rust panic into a silent
`abort()`, and the macOS-26 *foreground* AppIntents/UIIntelligence app-registration
path (`_registerApplicationWithUIIntelligence` → `LNProcessInstanceRegistryClient
registerWithError:`) was on the stack for an ad-hoc-signed app. This loop shipped a
Rust-only hardening fix and rebuilt the app green. The **web app remains the reliable,
primary live-demo spine** (tests **61/61**) and was untouched; the native layer still
has **zero location/privacy logic**.

- **Native startup hardening (committed `6bed290`, TASK-...1512 → done):**
  - **Panic-free launch** in `src-tauri/src/lib.rs`: no startup `.expect()`/`.unwrap()`
    can abort. The global shortcut is now registered **at runtime** via
    `app.global_shortcut().on_shortcut(chord, …)` and **logs + continues on failure**
    (a taken `Cmd+Shift+Space` no longer crashes — tray "I noticed something" + in-window
    Space hotkey are the fallbacks). The tray icon is set only if present; `builder.run()`
    logs instead of `.expect()`.
  - **Menu-bar / accessory agent**: `set_activation_policy(ActivationPolicy::Accessory)`
    (macOS) — the app lives in the menu bar (matching the product framing) and **avoids
    the foreground app-registration path implicated in the crash**, with no signing needed.
  - Verified: `cargo check` **clean (0 warnings)**; `npm run tauri:build` →
    runnable `…/release/bundle/macos/Was It Just Me.app` (Mach-O arm64, rebuilt 15:15);
    **web tests 61/61**; `build:core` output **byte-for-byte unchanged**. Only
    `src-tauri/src/lib.rs` changed.
- **Triage**: `Reviews/Review 6.md` converted to TASK-...1512 (done) + ISSUE-...1516
  (pending) and moved to `Reviews/processed/` (annotated) so it isn't reprocessed.

## Snapshot
- Tasks: candidates 0 · ready 0 · active 0 · done 10 (TASK-...1512 added this loop)
- Issues: pending **1** (ISSUE-...1516, the native re-verify/signing decision) ·
  approved 6 · rejected 2
- Reviews: 0 pending (6 processed — Review 6 triaged this loop)
- App: web app builds; `npm run dev` → http://localhost:5173/ ; **tests 61/61**.
  Native macOS `.app` **rebuilt green** (now a panic-free menu-bar/accessory app).
  `build:core` reference bundle unchanged.
- Issue gate: **1/10 — clear** (implementation still permitted). Config:
  refresh_minutes=1, unanswered_issue_limit=10.

## Now / Next
- **USER (the one blocker for the native path — please action ISSUE-...1516)**:
  `open "src-tauri/target/release/bundle/macos/Was It Just Me.app"` and confirm it now
  **launches without crashing**, shows a **menu-bar** icon (not Dock), the map window is
  visible, Cmd+Shift+Space fires one signal while backgrounded, close hides to menu bar,
  tray Quit exits. Approve the issue if green; if it still crashes, drop the new crash log
  as `Reviews/Review 7.md` (the loop will re-triage; likely escalates to a signing decision).
- **Loop #14 (default)**: if ISSUE-...1516 is approved/green → resume **GOAL #6 / M6 —
  web-demo polish** on the web spine (demo-facing copy, the reassuring "was it just me?"
  framing, reliability/UX). If a new crash review lands → triage it first. If the user
  provides a signing identity or a real logo, wire those in.
- **User live-test (web app, the demo spine — unaffected, always reliable)**:
  http://localhost:5173/ — Demo mode → activity strip / scrub / Play history (2×/4×) /
  Back to live / Density / Verification mode (off by default). Browser Space hotkey +
  Notice button unchanged.

## Blocked
- **Native `.app` user re-verification (ISSUE-...1516)** — the fix builds green but
  "does it launch without crashing?" is a **human GUI smoke-test** (headless can't run a
  GUI app). Not a build blocker; the web demo is unaffected.
- **DMG** intentionally off by default (headless bundler limitation); produce on demand in
  a GUI session (`npm run tauri -- build --bundles dmg`).
- **App icon is a placeholder** — swap via `tauri icon <png>` when a real logo exists.
- **Code signing**: app is ad-hoc signed. A Developer-ID/notarized build is the robust fix
  *only if* the accessory-app change didn't fully stop the crash (decision in ISSUE-...1516).

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it.
Config is `refresh_minutes=1`. A fixed-interval cron is more robust within a running
session — switchable on request.
