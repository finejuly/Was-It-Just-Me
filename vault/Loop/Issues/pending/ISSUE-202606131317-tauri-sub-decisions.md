---
id: 202606131317
title: Tauri pivot — confirm the few remaining build sub-decisions before scaffolding
status: pending
type: decision
created: 2026-06-13
raised_by: loop-orchestrate (loop #10)
relates_to: ISSUE-202606131314 ("move to Tauri"), TASK-202606131316 (Tauri shell)
blocks: starting the Tauri build (TASK-...1316)
---

## Context
You approved the **Tauri** route for the standalone sender ("Let's move to Tauri then.",
ISSUE-...1314). The plan (TASK-...1316) is to wrap the **existing web app verbatim** as
Tauri's frontend — reusing the privacy core, map, scrubber, demo mode, and the new activity
strip with no second privacy implementation. Before scaffolding, a few small choices benefit
from your input (per our "raise meaningful architecture decisions early" convention). The
platform itself is settled — these are just the knobs.

## Questions / options (each has a recommended default)

1. **Rust toolchain** — Tauri needs Rust/cargo. Is `rustup`/`cargo` already installed on this
   machine, or should the loop treat installing it as a prerequisite step for you to run?
   _Recommendation:_ tell me if it's installed; if not, I'll give you the one-line `rustup`
   install and pause the build until it's present (the loop won't modify your system tools).

2. **How a tray/global-hotkey send reaches the web map's `SignalStore`.**
   - (a) **Tauri event** — native emits an event; the frontend listens and calls the existing
     `sendSignal()` (which routes through `transformSignal` + `SignalStore.add`). _Recommended:
     simplest, keeps ALL privacy logic in the unchanged web code._
   - (b) **invoke command** — frontend invokes a Rust command; Rust returns; frontend adds.
   - (c) Rust computes nothing about location; it only signals "fire" (privacy stays in JS).
   _Recommendation: (a)._ It guarantees the native path is byte-for-byte the in-page path.

3. **Global shortcut binding.** Default proposal: a single, unobtrusive chord (e.g.
   `Cmd/Ctrl+Shift+Space`) registered via Tauri's `global-shortcut` plugin, configurable later.
   OK, or do you want a specific key?

4. **Tray behavior on close.** Default: closing the window **hides to tray** (app keeps running
   for background hotkey); Quit from the tray actually exits. OK, or should close = quit?

5. **Packaging scope for the hackathon.** Default: target a runnable `tauri dev` + a `tauri
   build` bundle for **this machine's OS only** (macOS), not multi-OS, to keep the demo focused.
   OK, or do you want cross-platform bundles?

## Recommendation summary
Defaults: 2(a) event-based, 3) `Cmd+Shift+Space`, 4) hide-to-tray, 5) this-OS bundle only.
If these are fine, just answer "defaults OK" (+ whether Rust is installed) and I'll scaffold.

## How to answer
Move this file to `Issues/approved/` with a one-line note (e.g. "defaults OK, Rust installed"),
or note any changes to the defaults above. Move to `Issues/rejected/` only if you want to
rethink the Tauri direction. Then the next loop scaffolds TASK-...1316 accordingly.

# Response

1. I don't know.
2. 