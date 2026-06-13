---
id: 202606131316
title: Tauri desktop shell wrapping the existing web app (native send path)
status: candidate
priority: high
source: ISSUE-202606131314 (user decision: "Let's move to Tauri then.")
created: 2026-06-13
blocked_by: ISSUE-202606131317 (Tauri sub-decisions) — scope confirm before building
---

## Summary
User chose **Tauri** as the native route for the standalone sender (ISSUE-...1314,
superseding the Swift/JSC menu-bar approach — TASK-...1313/...1315 closed). Tauri wraps
the **existing web app verbatim** as its frontend, so the privacy core, map, scrubber,
demo mode, and the new activity strip are reused as-is — a single privacy implementation,
no JSC bridge. The native shell adds the things a browser tab can't: a **system tray** and
a **true OS-global shortcut** for background "I noticed something" sends (PRD "Hotkey &
background behavior").

## Why Tauri fits
- **Reuse, don't rewrite**: the Vite/TS web build is the Tauri frontend; the tested privacy
  core runs in Tauri's webview natively — no second privacy code path, no JSC bridge.
- **Unblocks the build**: Tauri builds via Rust/cargo, sidestepping the broken Swift CLT
  (ISSUE-...1314) entirely.
- **Offline / no-LLM**: Tauri bundles the local assets; no network or LLM at runtime,
  consistent with the PRD.

## Scope (to be refined by loop-plan after ISSUE-...1317 is answered)
- Add a Tauri project that uses the existing Vite app as `frontendDist`/`devUrl` (do NOT
  fork the UI — point Tauri at the current build/dev server).
- **System tray**: tray icon + menu — "I noticed something" (fires one signal) · "Show map"
  (focus the window) · Quit. Launch quiet/low-energy.
- **Global shortcut** (Tauri `global-shortcut` plugin): a registered hotkey fires exactly one
  signal while the app is unfocused/backgrounded.
- **Bridge tray/hotkey → web SignalStore**: a tray/hotkey send must reach the same in-webview
  `SignalStore.add(transformSignal(...))` the in-page Space hotkey uses — the EXACT privacy
  path, no native privacy logic. (Mechanism = ISSUE-...1317 sub-decision: emit a Tauri event
  the frontend listens for, vs. invoke a command, vs. inject a keypress.)
- Keep the plain web app + in-page Space hotkey intact as the instant browser fallback/demo.

## Acceptance criteria (draft — loop-plan to finalize)
- [ ] `tauri dev` launches the existing web UI in a native window (no UI fork).
- [ ] Tray menu present; "I noticed something" adds one privacy-transformed signal to the map.
- [ ] A global shortcut fires exactly one signal while the app is backgrounded/unfocused.
- [ ] The native send goes through the **unchanged** `transformSignal`/`SignalStore` path —
      no new privacy code; record schema unchanged; no raw coords leak.
- [ ] Builds and runs offline; no LLM at runtime; existing `npm test`/`npm run build` stay green.
- [ ] (If time) `tauri build` produces a bundle for at least the dev machine's OS.

## Notes
- Rust/cargo toolchain presence must be probed first (Tauri needs it). If absent, that is an
  install step for the user — raise it, don't guess.
- The closed Swift bridge (`native/WIJMCore/`) stays as a reference artifact only.
- Do not start the build until ISSUE-...1317 (Tauri sub-decisions) is answered.
