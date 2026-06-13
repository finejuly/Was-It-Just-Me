---
id: 202606131614
title: Make the menu-bar .app actually present the map window on launch (it opened "nothing")
status: ready            # candidate → ready → active → done
priority: high
source: ISSUE-202606131516 (approved) — user Response: "No crash, but nothing was opened"
created: 2026-06-13
---

## Summary
ISSUE-202606131516 was **approved** (the rebuilt `.app` no longer crashes — the Loop
#13 panic-free + `ActivationPolicy::Accessory` fix worked). But the user's Response
flagged a real launch-visibility defect:

> "No crash, but nothing was opened when `open "…/Was It Just Me.app"`"

So the crash is gone, but double-clicking the app shows **nothing** — no window comes
to the front. This is the expected behavior of an **accessory (menu-bar/`LSUIElement`)
app**: macOS does not auto-front an accessory app's window on launch the way it does a
regular foreground app, and a fresh launch produces no Dock bounce, so to the user it
looks like nothing happened. The window is configured `visible: true` in
`tauri.conf.json`, but visibility != frontmost/focused for an accessory process.

Traces to GOAL #1 (native background hotkey, M4). The web app at http://localhost:5173/
remains the reliable primary demo spine and is untouched.

## Root cause
- `set_activation_policy(ActivationPolicy::Accessory)` (Loop #13, to dodge the crash)
  makes the app a menu-bar agent with no Dock presence. Accessory apps do not get the
  automatic "bring the app's main window forward + focus it" that foreground apps get
  at launch — so the (technically visible) window is created behind everything / not
  focused, and the user perceives a no-op launch.
- There was no explicit `window.show()/set_focus()` in `setup`, so launch relied on the
  config's `visible: true` alone, which is insufficient for an accessory app to surface.

## Fix (native only; ZERO privacy/location logic touched)
In `src-tauri/src/lib.rs` `setup`, after building the tray, **explicitly bring the main
window to the front on launch** so the operator sees the map immediately:
- `app.set_activation_policy(ActivationPolicy::Regular)` momentarily is NOT used (that
  re-enters the foreground app-registration path implicated in the crash — rejected).
  Instead: get the `main` webview window and call `.show()`, `.set_focus()`, and (macOS)
  `.unminimize()` so an accessory launch reliably surfaces the map window. Keep
  `ActivationPolicy::Accessory`.
- This reuses the exact same surfacing path as the tray "Show map" item (`show_main`),
  so there is one code path for presenting the window.
- The close-to-tray behavior is unchanged; tray Quit still the only exit.

## Acceptance criteria
- `cargo check` clean (0 warnings) under `src-tauri/`.
- `npm run tauri:build` produces a runnable `…/release/bundle/macos/Was It Just Me.app`.
- Web tests still 61/61; `build:core` reference bundle byte-for-byte unchanged.
- Only `src-tauri/src/lib.rs` changes (native layer); no privacy/location code touched.
- Human GUI smoke-test (re-verify): launching the `.app` now shows the **map window
  front-and-center**, with a **menu-bar** icon (not Dock), and Cmd+Shift+Space / tray
  still work. (Raised as the next re-verify note for the user.)

## Notes
- Verifying "the window now appears on launch" is again an irreducible human GUI step
  (headless can't run a GUI app). Build green here; hand the user the `open …app` check.
</content>
</invoke>
