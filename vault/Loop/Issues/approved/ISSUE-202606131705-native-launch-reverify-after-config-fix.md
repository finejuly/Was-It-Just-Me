---
id: 202606131705
title: Re-verify (3rd) — does the rebuilt .app now LAUNCH and SHOW the map after the global-shortcut config fix?
status: pending             # pending → approved | rejected (user moves the file)
type: blocker
created: 2026-06-13
raised_by: loop-orchestrate
loop: 15
blocks: none (web demo spine is unaffected and fully reliable)
supersedes: ISSUE-202606131620 (its Response reported the new error this fixes)
---

## Context — what changed since your last test
You ran the binary directly and got a **new** error (no longer the SIGABRT crash):

```
[wijm] desktop shell exited with error: failed to initialize plugin `global-shortcut`:
Error deserializing 'plugins.global-shortcut' within your Tauri configuration:
invalid type: map, expected unit
```

Root cause (now fixed, Loop #15 / TASK-202606131700, commit `7ab5dfa`):
`tauri.conf.json` had a `plugins.global-shortcut: {}` block. The
`tauri-plugin-global-shortcut` v2 plugin takes **no** JSON config (its config type
is a *unit*), so the empty `{}` was parsed as a **map** and Tauri rejected the
config at startup — aborting **before** Loop #14's "show the window on launch" fix
could ever run. The plugin is registered + configured entirely at runtime in
`lib.rs`, so the config block was both invalid and unnecessary; it has been removed.

Headless verification done this loop: `cargo check` clean (0 warnings); the JSON now
parses with no `plugins` key; web tests **66/66**; the `build:core` privacy-core
bundle SHA is byte-for-byte unchanged. **No privacy/location code was touched.**
What I cannot do headlessly is launch a GUI app — hence this re-verify.

The web app at http://localhost:5173/ remains the primary, fully reliable demo spine
regardless. The native shell is the "true background hotkey" flourish.

## How to verify (please run)
1. Be on latest `main` (includes commit `7ab5dfa`). Rebuild:
   `source ~/.cargo/env` (if needed) then `npm run tauri:build`.
2. Launch via Terminal so you can see any console output:
   `"src-tauri/target/release/bundle/macos/Was It Just Me.app/Contents/MacOS/was-it-just-me"`
   (or `open "src-tauri/target/release/bundle/macos/Was It Just Me.app"`).
3. Confirm: **no `invalid type: map` error**; the **map window appears** front-and-center
   on launch; a **menu-bar** icon is present (not the Dock); the tray menu has
   "I noticed something" / "Show map" / "Quit".
4. Press **Cmd+Shift+Space** while another app is focused → exactly one signal drops.
   (If the OS already owns the chord it silently no-ops — tray item + in-window Space
   are the fallbacks.)
5. Close the window → it hides (app stays in the menu bar); tray **Quit** exits.

## Options
1. **Approve as fixed (recommended if step 3 passes)** — the menu-bar app now launches
   and presents the map; ship it as the native flourish, web app stays the demo spine.
2. **A new/different error or still nothing shows** → paste the exact console output
   (or drop `Reviews/Review 7.md`) and the loop will dig deeper (next-likely areas:
   window geometry/off-screen position, or another plugin/permission mismatch).

## Recommendation
Rebuild, run steps 2–5, and **approve option 1** if the map window now appears with no
config error. If anything else surfaces, paste the console line — each of these has
been a precise, one-shot-fixable config/runtime error, and this one was diagnosable
straight from the message you provided.


# Response

The app is open now, but no dot generated after signaling
