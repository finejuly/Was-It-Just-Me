---
id: 202606131315
title: Native sender increment B — NSStatusItem GUI + true global hotkey + IPC to web map
status: candidate
priority: high
source: TASK-202606131313 (increment B split-off) + ISSUE-202606131312 (approved: native)
created: 2026-06-13
blocked_by: TASK-202606131313 (increment A: swift build/test green) and ISSUE-202606131314 (toolchain)
---

## Summary
Second half of the approved native macOS menu-bar sender. Increment A (this loop) built and verified the privacy bridge (`WIJMCore`: Swift → JavaScriptCore → unchanged TS privacy core; JS contract green at 57/57). Increment B adds the actual **menu-bar GUI app** and a **true OS-global hotkey** on top of that bridge, and surfaces sent signals on the existing web map.

## Scope
- **`NSStatusItem` menu-bar app** (AppKit/SwiftUI), `LSUIElement` (no Dock icon), launches hidden/quiet. Tray menu: "I noticed something" (fires a signal) · "Show map" (opens the web app) · Quit.
- **True global hotkey** (Carbon `RegisterEventHotKey`, or `MASShortcut`) that fires `SignalCore.transform(...)` while the app is unfocused/backgrounded — the PRD "Hotkey & background behavior" the web tab can't truly satisfy.
- **IPC to the web map**: decide how the native-sent record reaches the web view's `SignalStore`. Candidate approaches (raise a sub-decision issue if non-obvious): (a) append to a shared local JSON file the web app polls; (b) a tiny localhost loopback the web app reads; (c) `WKWebView` hosting the Leaflet build inside the native shell and calling `store.add(...)` over the JS bridge (closest to one app, reuses the UI). Must stay offline / no LLM.
- Quiet confirmation (tray icon flash / subtle sound), low idle energy. Keep the in-browser Space hotkey + web build intact as the instant fallback.

## Acceptance criteria (to be refined by loop-plan)
- [ ] Menu-bar app launches hidden, tray menu works (send / show map / quit), no Dock icon.
- [ ] A registered **global** hotkey fires exactly one signal while the app is backgrounded/unfocused.
- [ ] The signal goes through `SignalCore` (the verified bridge) — **no new privacy code path**; record schema unchanged.
- [ ] The sent record appears on the web map (whichever IPC is chosen), still privacy-transformed.
- [ ] Runs offline; web app remains the map/view + fallback; existing JS suite stays green.

## Notes
- Do NOT start until increment A's `swift build && swift test` is green (currently blocked by ISSUE-...1314 toolchain skew). Until then this is a planning placeholder.
- Reuse the bridge from increment A verbatim; Swift writes no privacy logic.

## Closed — loop #10 (2026-06-13) — SUPERSEDED by the Tauri pivot
Superseded by the user's "move to Tauri" decision (ISSUE-...1314). The NSStatusItem GUI +
Carbon global hotkey are replaced by Tauri's tray + global-shortcut plugins over the
existing web app. The PRD goals this task served (tray, true global hotkey, background
operation) carry over to **TASK-...1316** (Tauri shell); the open IPC sub-decision carries
over to **ISSUE-...1317**. Closed — moved to done/ to clear the candidate pipeline.
