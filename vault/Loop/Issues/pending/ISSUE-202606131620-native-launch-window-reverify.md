---
id: 202606131620
title: Re-verify — does the rebuilt menu-bar .app now SHOW the map window on launch?
status: pending             # pending → approved | rejected (user moves the file)
type: blocker
created: 2026-06-13
raised_by: loop-orchestrate
blocks: none
---

## Context
You approved ISSUE-202606131516 (the rebuilt `.app` no longer **crashes** — the Loop
#13 panic-free + accessory-app fix worked), and noted in your Response:

> "No crash, but nothing was opened when `open "…/Was It Just Me.app"`"

Root cause: as a menu-bar **accessory** app (no Dock icon), macOS does not auto-bring
the window forward on launch, so `"visible": true` alone left the map window behind /
unfocused and it looked like nothing happened.

Loop #14 fix (TASK-202606131614, committed this loop): in `src-tauri/src/lib.rs`
`setup`, after wiring the tray, the app now **explicitly surfaces the map window** via
the same path the tray "Show map" uses — `unimimize()` + `show()` + `set_focus()`,
all infallible so it cannot reintroduce the crash. Activation policy stays `Accessory`
(menu bar, not Dock). `cargo check` clean (0 warnings); web tests **66/66**; `build:core`
bundle byte-for-byte unchanged. **No privacy/location code was touched.**

The web app at http://localhost:5173/ remains the primary, fully reliable demo spine
regardless — the native shell is the "true background hotkey" flourish.

## How to verify (please run)
1. Be on latest `main`. Rebuild so the `.app` includes this fix:
   `source ~/.cargo/env` (if needed) then `npm run tauri:build`.
2. `open "src-tauri/target/release/bundle/macos/Was It Just Me.app"`
3. Confirm: the **map window now appears front-and-center on launch** (not "nothing");
   a **menu-bar** icon is present (not the Dock); the tray menu has "I noticed
   something" / "Show map" / "Quit".
4. Press **Cmd+Shift+Space** while another app is focused → exactly one signal drops.
   (If the OS already claims the chord it silently no-ops — tray item + in-window Space
   are the fallbacks.)
5. Close the window → it hides (app stays in the menu bar); tray **Quit** exits.
6. If the window still does not appear (or any new crash): attach details / a crash log
   as `Reviews/Review 7.md` and the loop will re-triage.

## Options
1. **Approve as fixed (recommended if step 3 passes)** — the menu-bar app now presents
   the map on launch; ship it as the native flourish, web app stays the demo spine.
2. **Still nothing shows** → drop a `Reviews/Review 7.md` with what you see (menu-bar
   icon present? window off-screen? console output from launching via Terminal:
   `"src-tauri/target/release/bundle/macos/Was It Just Me.app/Contents/MacOS/"*`).
   The loop will dig deeper (e.g. window position/geometry, or a screen-recording note).

## Recommendation
Rebuild, run steps 2–5, and **approve option 1** if the map window now appears. Only if
it still doesn't surface do we need Review 7 with the new observations.
</content>
