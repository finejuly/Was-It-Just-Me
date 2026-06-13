---
id: 202606131310
title: How should the standalone signal-sender app be built (Tauri vs Electron vs native)?
status: rejected
type: decision
created: 2026-06-13
resolved: 2026-06-13
raised_by: loop-orchestrate (from Review 5, item 3)
revisits: ISSUE-202606131230 (platform decision)
blocks: standalone-sender implementation task (global hotkey + tray)
---

## Resolution (loop #8, 2026-06-13)
User moved this file to `Issues/rejected/`. Per orchestrator direction: **stay on the web app for now — no Tauri/Electron standalone pivot this loop.** No standalone-sender build was started.

**Ambiguity flagged (not silently resolved):** the working-tree file also carried a `# Response` annotation reading *"Implement Native menu-bar app"* (Option 3, Swift/SwiftUI). That conflicts with (a) the file being in `rejected/` and (b) Option 3 being explicitly out of scope here (it cannot reuse the Leaflet UI and would require rewriting the tested TS core in Swift — violates the "reuse, don't rewrite" preference). Because this is a costly, hard-to-reverse, user-gated platform decision, loop #8 did **not** start a native app. Instead it raised a fresh clarifying issue (**ISSUE-202606131312**) asking the user to confirm intent: stay web, or pursue a native menu-bar app despite the rewrite cost. See that issue.

## Context
Review 5 (item 3) asks that signal transmission be a **standalone app rather than the web**: "accessing the web to send a signal after detecting something would be too slow." The PRD (Hotkey & background behavior) wants a **true global hotkey**, **quiet background/tray** operation, and **low energy**. Today the trigger is an in-page Space `keydown` in `src/main.ts`, which only fires when the browser window is focused — exactly the limitation being raised. This revisits the earlier web-app platform decision (ISSUE-202606131230): the **map/view** can stay web, but the **send** path should become standalone.

What we have that should be REUSED (not rewritten):
- Pure, tested TS core: `src/core/privacy.ts`, `src/core/geohash.ts`, `src/core/aggregate.ts`, `src/sim/simulator.ts`. Only platform dependency is `globalThis.crypto`, available in any modern webview and in Node — so it runs unchanged in Tauri or Electron.
- Leaflet UI: `src/ui/mapView.ts`, `store.ts`, `config.ts`, `index.html` + the Vite build — reusable verbatim inside a webview.
- Send path `sendSignal()` already does triggerSignal/transformSignal → store.add → confirm.

Toolchain probed on this Mac: Node v24.14.0 + npm 11.9.0 ✅, Xcode CLT ✅, Homebrew ✅, Swift 6.2 ✅. **Rust/cargo: NOT installed.**

## Options
1. **Tauri v2 (Rust shell + system WebKit webview) — recommended.**
   - + True global hotkey (`tauri-plugin-global-shortcut`, fires when unfocused) + tray + start-hidden background; lightweight (~30–80 MB idle, small binary) — best match for the PRD's low-energy line.
   - + Reuses 100% of the TS core and nearly all the Leaflet UI; hotkey lives in Rust and emits an event the existing `sendSignal()` handles.
   - − Rust is NOT installed: one-time `rustup` (~1.5 GB) + cold `cargo build` (~3–8 min) before the demo. Xcode CLT (present) satisfies the linker, so install is unattended.
2. **Electron (bundled Chromium + Node) — zero-extra-toolchain fallback.**
   - + Works today: Node already present, `npm i -D electron`. True global hotkey (`globalShortcut`) + `Tray`; same UI/core reuse as Tauri.
   - − Heavy (~150–250 MB idle, ~80–150 MB installer); contradicts "lightweight/low-energy" but fine for a one-off demo.
3. **Native menu-bar app (Swift/SwiftUI, `NSStatusItem`).**
   - + Most native tray feel, lowest energy.
   - − Cannot reuse the Leaflet UI and would require rewriting the TS core in Swift (or embedding JavaScriptCore) — highest effort, violates "reuse, don't rewrite". Not for this loop.
4. **PWA + OS Shortcuts/Automator hotkey — rejected:** still routes through the browser, the exact slowness Review 5 rejects.

## Recommendation
**Option 1 (Tauri v2).** Satisfies Review 5 literally (real standalone app, OS-global hotkey, background tray), matches the PRD's lightweight framing, and reuses the entire tested TS core plus the Leaflet UI — almost all new code is a ~150-line shell. The only real demo risk is the missing Rust toolchain: **install Rust and pre-build the binary before stage**, keeping the browser build as an instant fallback. If day-of the Rust install/build feels risky, fall back to **Option 2 (Electron)** for zero extra toolchain at the cost of a heavier process.

Implementation outline (either shell): new `src-tauri/` (or Electron main) that (a) registers the global hotkey, (b) emits an event/IPC to the webview where the existing `sendSignal()` runs unchanged, (c) adds a tray with show/hide + Quit and starts hidden. Add a small persistence adapter (save/load `SignalRecord[]`) for historical replay (PRD MVP #8); keep the in-page Space handler so it still demos in a plain browser.

## How to answer
Move this file to `Issues/approved/` (note Tauri or Electron) or `Issues/rejected/`, or just reply. If approved for Tauri, the first task should install Rust + scaffold `src-tauri/` and pre-build the demo binary well before the hackathon.

# Response

**Implement Native menu-bar app
