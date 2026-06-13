# Loop #13 — 2026-06-13

## Modules run
- **Triage** (orchestrator): processed `Reviews/Review 6.md` (a real macOS crash report).
- **Implementation** (`loop-implement`): shipped the native startup hardening fix.
- **Issue** (`loop-create-issue`): raised ISSUE-...1516 for human re-verify + signing decision.
- (No discovery/planning needed — the crash was well-understood and the plan was concrete;
  M6 web polish deferred to loop #14 since the crash was higher-value.)

## Trigger
Loop #12 left 0 pending issues and pointed at M6 web polish. But a **new unprocessed
review** (`Review 6.md`, 15:08) showed the built `Was It Just Me.app` **crashing on
launch** (`SIGABRT`/`abort()` on the main thread, macOS 26.3.1). Per the orchestrator
procedure, Reviews are triaged before dispatching new work — and a demo-killing native
crash outranks copy polish.

## Root cause (from the crash log + the built artifact)
- `EXC_CRASH (SIGABRT)`, `abort() called`, faulting thread = `main`.
- Utility thread mid `-[NSApplication _registerApplicationWithUIIntelligence]` →
  `-[LNProcessInstanceRegistryClient registerWithError:]` (AppIntents, sync XPC) — the
  macOS-26 **foreground** app-registration path.
- App is **ad-hoc signed** (`TeamIdentifier=not set`), no entitlements, `procRole:
  Foreground`. Release profile = `panic = "abort"` + `strip = true`, so **any startup
  Rust panic also surfaced as a bare `abort()`** with no message.

## What changed
- **Code** (committed `6bed290`): `src-tauri/src/lib.rs` (Rust/config only; web + privacy
  untouched; native layer keeps ZERO location logic):
  - Removed all 3 startup panic sites. Global shortcut now registered at **runtime** via
    `global_shortcut().on_shortcut(chord, …)` → logs+continues on failure. Tray icon set
    only `if let Some(icon)`. `builder.run()` logs instead of `.expect()`.
  - App now a **menu-bar/accessory agent** via `set_activation_policy(Accessory)` (macOS) —
    avoids the foreground registration path; matches the "lives in the menu bar" framing.
- **Vault**:
  - TASK-...1512 created in `ready/`, implemented, → `done/` (annotated with results).
  - ISSUE-...1516 created in `Issues/pending/` (human GUI re-verify + signing fallback).
  - `Review 6.md` → `Reviews/processed/` (annotated as triaged).
  - Progress.md updated.

## Verification
- `cargo check` **clean, 0 warnings**.
- `npm run tauri:build` → runnable `…/release/bundle/macos/Was It Just Me.app` (arm64).
- `npm test` **61/61**; `npm run build:core` **byte-for-byte unchanged** vs committed bundle.
- Diff scope: only `src-tauri/src/lib.rs` (1 file).

## Issue gate
**1/10 — clear.** Implementation was permitted and ran. (Was 0 pending at loop start;
ISSUE-...1516 raised after the work, for human verification.)

## Blocked / needs user
- **ISSUE-...1516** — user must `open` the rebuilt `.app` and confirm it launches without
  crashing (a GUI smoke-test the loop can't do headless). If it still crashes, attach a new
  crash report as `Reviews/Review 7.md` (likely → Developer-ID signing decision).
- Web demo spine is **unaffected and reliable** regardless of the native-app outcome.

## Next loop (#14)
- If ISSUE-...1516 is approved/green → resume **GOAL #6 / M6 web-demo polish**.
- If a new crash review (`Review 7.md`) lands → triage first.
- Optional: wire a signing identity or a real app icon if the user provides them.
