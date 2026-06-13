---
id: 202606131512
title: Harden Tauri shell startup so the macOS .app does not abort() on launch
status: ready            # candidate → ready → active → done
priority: high
source: REVIEW-Review 6 (native .app crash on launch)
created: 2026-06-13
---

## Summary
`Reviews/Review 6.md` is a real macOS crash report: launching the built
`Was It Just Me.app` aborts on startup (`EXC_CRASH` / `SIGABRT`, `abort()` on the
main thread ~2s after launch). This kills any "show the native app" demo path. The
web app remains the reliable demo spine and is unaffected — but the native shell
(GOAL #1 background hotkey, M4) must at minimum *launch* to be demo-worthy.

Traces to GOAL #1 (one-gesture background send via the native shell) and the
durable rule that the native layer is a thin host with ZERO location/privacy logic.

## Crash analysis (grounded in the report + the built artifact)
- `Exception Type: EXC_CRASH (SIGABRT)`, `asi: abort() called`, faulting thread =
  `main` (`com.apple.main-thread`). The app's own (stripped) frames call `abort`.
- Utility thread (`com.apple.root.utility-qos`) is mid
  `-[NSApplication _registerApplicationWithUIIntelligence]` →
  `-[LNProcessInstanceRegistryClient registerWithError:]` (AppIntents framework)
  doing a **synchronous XPC** call. On macOS 26.3.1 (the user's OS, per the report)
  AppKit registers *foreground* apps with the AppIntents/UIIntelligence registry at
  launch.
- The built app is **ad-hoc signed** (`Signature=adhoc`, `TeamIdentifier=not set`),
  has **no entitlements**, **no `LSUIElement`**, and runs as `procRole: Foreground`.
- The release profile (`src-tauri/Cargo.toml`) sets `panic = "abort"` + `strip = true`,
  so **any Rust panic at startup becomes a silent bare `abort()`** with no message —
  indistinguishable in the log from the AppIntents abort.

Two independent, both-plausible causes, both addressable here:
1. **Rust panic at startup** from a fragile `.expect()`/`.unwrap()` in
   `src-tauri/src/lib.rs` (global-shortcut registration is the most fragile — the
   `Cmd+Shift+Space` chord may already be claimed by the OS/another app; also
   `default_window_icon().cloned().unwrap()`).
2. **Foreground AppIntents/UIIntelligence registration** aborting for an
   ad-hoc-signed app — sidestepped by running as a menu-bar/accessory (agent) app.

## Scope / notes
Rust + Tauri-config ONLY. Do NOT touch web/`src/` code, the privacy transform, or
the core bundle. The native layer must keep ZERO location logic. Keep the diff small.

1. **Make startup panic-free** in `src-tauri/src/lib.rs`:
   - Replace `tauri::Builder…run().expect("…")` with graceful handling: log the
     error and return instead of panicking (panic = abort would otherwise SIGABRT).
   - Replace `app.default_window_icon().cloned().unwrap()` with a fallback: only set
     the tray icon if one is available; a missing icon must not crash the tray build.
   - Replace the global-shortcut `…with_shortcut(chord).expect("…")` so a failed
     registration logs and the app still launches (tray + in-window notice still work).
2. **Make global-shortcut registration tolerant**: if `Cmd+Shift+Space` cannot be
   registered, continue without it (no panic). The tray "I noticed something" and the
   in-window Space hotkey remain functional fallbacks for the demo.
3. **Run as a menu-bar / accessory (agent) app**: set `LSUIElement` / activation
   policy = accessory for macOS (via `tauri.conf.json` macOS plist /
   `app.macOSPrivateApi` or the macOS `setActivationPolicy` in `setup`). This both
   matches the product framing ("lives in the menu bar") AND avoids the foreground
   AppIntents/UIIntelligence registration path implicated in the crash. The window
   must still be showable from the tray "Show map" item (call `set_focus`/`show`,
   and bump activation policy to Regular while a window is visible if needed).

## Acceptance criteria
- [ ] `src-tauri/src/lib.rs` has **no startup `.expect()`/`.unwrap()`** that can
      `abort()`; shortcut-registration failure and missing icon are handled gracefully
      (logged, app continues).
- [ ] App runs as a menu-bar/accessory app (LSUIElement / accessory activation policy
      set), and the tray "Show map" still brings up the map window.
- [ ] `cargo check` is clean (0 warnings) under `src-tauri/`.
- [ ] `npm run tauri:build` produces a runnable `Was It Just Me.app` (bundle succeeds).
- [ ] Web app unaffected: `npm test` 61/61; `npm run build:core` output byte-for-byte
      unchanged vs committed `wijm-core.js`.
- [ ] Native layer still contains ZERO location/privacy logic.

## Out of scope / follow-up
- Final confirmation that the **rebuilt app launches without crashing** is a human
  GUI smoke-test (headless cannot run a GUI app) — tracked as a pending issue.
- Developer-ID / notarized signing (to fully satisfy macOS 26 registration for a
  *foreground* app) is a separate decision raised in the same pending issue; the
  accessory-app change above is the no-signing-required mitigation.

## Done — loop #13 (2026-06-13)
Implemented in `src-tauri/src/lib.rs` (Rust/config only; web + privacy untouched):
- Removed all three startup panic sites: the plugin no longer registers the chord at
  build time with `.expect()`; the shortcut is now registered at runtime via
  `app.global_shortcut().on_shortcut(chord, …)` and **logs + continues on failure**.
  The tray icon is set only `if let Some(icon) = app.default_window_icon()` (no
  `.unwrap()`). `builder.run(...)` no longer `.expect()`s — it logs on error.
- App now runs as a **menu-bar / accessory agent** via
  `app.set_activation_policy(ActivationPolicy::Accessory)` in `setup` (macOS, behind
  `#[cfg(target_os = "macos")]`; infallible on the `&mut App`). This matches the
  product framing and avoids the foreground app-registration path implicated in the
  Review 6 crash. Tray "Show map" still shows/focuses the window.
- Used the runtime `GlobalShortcutExt::on_shortcut` API (returns `Result`) instead of
  the panic-prone build-time `Builder::with_shortcut(...).expect(...)`.

Verification (this loop):
- `cargo check` **clean, 0 warnings**.
- `npm run tauri:build` → runnable `…/release/bundle/macos/Was It Just Me.app`
  (Mach-O arm64, ad-hoc signed, rebuilt).
- `npm test` **61/61**; `npm run build:core` output **byte-for-byte unchanged** vs
  committed `wijm-core.js`. Only `src-tauri/src/lib.rs` changed.

Acceptance: all criteria met **except** the human GUI launch smoke-test (inherently
not headless-verifiable) → see ISSUE-202606131516.
