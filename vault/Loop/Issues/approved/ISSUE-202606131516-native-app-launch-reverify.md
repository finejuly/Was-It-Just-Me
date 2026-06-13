---
id: 202606131516
title: Does the rebuilt menu-bar .app now launch without crashing — and if a foreground/Dock app is wanted, do we sign it?
status: pending             # pending → approved | rejected (user moves the file)
type: blocker
created: 2026-06-13
raised_by: loop-orchestrate
blocks: none
---

## Context
`Reviews/Review 6.md` was a real macOS crash report: the previously built
`Was It Just Me.app` **aborted on launch** (`EXC_CRASH` / `SIGABRT`, `abort()` on the
main thread ~2s in) on macOS **26.3.1**. The crash log's utility thread was mid
`-[NSApplication _registerApplicationWithUIIntelligence]` →
`-[LNProcessInstanceRegistryClient registerWithError:]` (AppIntents framework, sync
XPC) — the macOS *foreground* app-registration path. The built app is **ad-hoc signed**
(`TeamIdentifier=not set`, no entitlements), and the release profile uses
`panic = "abort"` + `strip = true`, so any startup Rust panic would also have shown as
a bare `abort()`.

Loop #13 shipped a Rust-only hardening fix (committed `6bed290`, TASK-202606131512):
- **Panic-free launch**: removed every startup `.expect()`/`.unwrap()` (global-shortcut
  registration now runs at runtime and logs+continues on failure; tray icon optional;
  `run()` logs instead of `.expect()`). A taken hotkey or missing icon can no longer abort.
- **Menu-bar / accessory agent**: `set_activation_policy(Accessory)` — the app lives in
  the menu bar (matching the product framing) and **avoids the foreground
  app-registration path implicated in the crash**, with no code signing required.

`cargo check` clean, `npm run tauri:build` produces a fresh runnable `.app`, web tests
61/61, core bundle unchanged. **But whether the rebuilt app actually launches without
crashing can only be confirmed by a human GUI smoke-test** — headless automation in the
loop cannot run a GUI app. This issue captures that verification + the follow-on signing
decision. Relates to GOAL #1 (background hotkey via the native shell, M4).

## How to verify (please run)
1. Be on latest `main` (commit `6bed290` or later). `source ~/.cargo/env` if needed.
2. `open "src-tauri/target/release/bundle/macos/Was It Just Me.app"`
3. Confirm: **no crash**; an icon appears in the **menu bar** (not the Dock); the map
   window is visible; the tray menu has "I noticed something" / "Show map" / "Quit".
4. Press **Cmd+Shift+Space** while another app is focused → exactly one signal drops on
   the map. (If the chord is already claimed by the OS, it silently no-ops — the tray
   "I noticed something" item and the in-window Space hotkey are the fallbacks.)
5. Closing the window hides it (app stays in the menu bar); tray **Quit** exits.
6. If it still crashes: please attach the new crash report (or `Console.app` →
   crash logs) as `Reviews/Review 7.md` so the loop can re-triage.

## Options
1. **Approve as fixed (recommended path if step 2-5 pass)** — the accessory menu-bar app
   is the demo target. No signing needed. Note: the **web app at http://localhost:5173/
   remains the primary, fully reliable live-demo spine regardless** — the native shell is
   the "true background hotkey" flourish, not the demo's backbone.
2. **Still crashes → escalate signing** — if the accessory change didn't stop the abort,
   the most robust fix is a **Developer-ID signed (and ideally notarized) build** so macOS
   26 trusts the app for registration. This needs your Apple Developer Team ID + a signing
   identity. Decide: (a) provide a signing identity and we wire up `tauri.conf.json`
   signing, or (b) accept that the native `.app` is demoed only on this machine via a
   local-trust workaround, or (c) drop the native shell from the live demo and present the
   web app + the (already-passing) hotkey story via the web Space key.
3. **Want a Dock (foreground) app, not menu-bar** — revert the accessory policy. This
   re-enters the foreground registration path, so it would then *require* option 2's
   signing to be crash-safe on macOS 26.

## Recommendation
Run the verify steps. If it launches cleanly (very likely), **approve option 1** — ship
the menu-bar app and keep the web app as the demo spine. Only if it still crashes do we
need a signing decision (option 2); raise a fresh review with the new crash log and the
loop will pick it up. Do **not** revert to a foreground/Dock app (option 3) without
signing, as that reintroduces the exact crash path.

# Response

No crash, but nothing was opened when open "src-tauri/target/release/bundle/macos/Was It Just Me.app"