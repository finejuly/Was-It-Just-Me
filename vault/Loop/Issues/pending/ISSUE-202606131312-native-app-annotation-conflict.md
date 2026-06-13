---
id: 202606131312
title: Your note on the rejected standalone-app issue said "Implement Native menu-bar app" — confirm intent?
status: pending
type: decision
created: 2026-06-13
raised_by: loop-orchestrate (loop #8)
relates_to: ISSUE-202606131310 (standalone sender), ISSUE-202606131230 (platform decision)
---

## Context
You moved **ISSUE-202606131310** (standalone signal-sender app: Tauri vs Electron vs native) into `Issues/rejected/`. But that same file's `# Response` section reads **"Implement Native menu-bar app"** — i.e. Option 3 (a native Swift/SwiftUI `NSStatusItem` app).

These two signals point in opposite directions, so loop #8 did **not** act on either guess:
- **Rejected location** → read literally, means "stay on the web app, no standalone pivot." (This is what the loop direction assumed, and what loop #8 followed — it shipped a web-only increment.)
- **"Implement Native menu-bar app"** → would mean *approve* the standalone pivot, specifically the **most expensive** option: a native menu-bar app cannot reuse the Leaflet UI and would require **rewriting the tested TS privacy core in Swift** (or embedding JavaScriptCore). That contradicts the standing "reuse, don't rewrite" preference and was flagged out-of-scope in ISSUE-...1310 itself.

This is a costly, hard-to-reverse platform decision, so per the loop's "raise an issue rather than guess" rule, I'm surfacing it instead of picking one.

## Options
1. **Stay on the web app (recommended for the hackathon).** Keep shipping the working web demo (real geolocation, privacy transform, demo mode + the new stage playback). The in-page Space hotkey works while the tab is focused; that's acceptable for a stage demo where the browser is up. No new toolchain, no rewrite, lowest risk before the deadline.
2. **Native menu-bar app (Swift/SwiftUI), as your note literally says.** Most native tray/hotkey feel and lowest idle energy, BUT highest effort: rewrite the privacy/sim core in Swift or embed JS; no Leaflet reuse. Realistically too large to land reliably before the hackathon.
3. **Standalone but reuse-friendly (Tauri v2 or Electron).** If you want a true global hotkey + background tray *without* rewriting the core, this reuses 100% of the TS core and the Leaflet UI behind a thin shell. Tauri = lightweight but needs a one-time Rust install; Electron = heavier but zero extra toolchain. (This was the original ISSUE-...1310 recommendation.)

## Recommendation
**Option 1 (stay web)** for the hackathon timeline; if a real standalone sender is wanted, **Option 3 (Tauri/Electron)** over Option 2, because it satisfies the global-hotkey/background goal while preserving the tested core. Only choose Option 2 if a native menu-bar app is a hard requirement and the rewrite cost is acceptable.

## How to answer
Reply, or move this file to `Issues/approved/` with a one-word note (web / tauri / electron / native), or to `Issues/rejected/` to confirm "stay web, stop asking."
