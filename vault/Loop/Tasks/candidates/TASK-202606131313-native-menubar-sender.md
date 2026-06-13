---
id: 202606131313
title: Native menu-bar signal-sender app (Swift/SwiftUI NSStatusItem, global hotkey + tray)
status: candidate
priority: high
source: ISSUE-202606131312 (approved: native) + ISSUE-202606131310 Option 3
created: 2026-06-13
blocked_by: none (decision approved)
---

## Summary
User approved a **native macOS menu-bar app** (Option 2 of ISSUE-...1310; confirmed via ISSUE-...1312 `# Response: Native`) for the *send* path: a `NSStatusItem` tray app with a true **OS-global hotkey** and quiet background operation, matching the PRD "Hotkey & background behavior." The existing web app stays the **map/view** and the instant demo fallback.

## Key constraint (from the issue analysis — must be planned, not hand-waved)
A native Swift app **cannot reuse the Leaflet UI** and **cannot directly import the TS privacy/sim core**. The privacy spine (`src/core/privacy.ts` jitter+bucketing, geohash, k-anon, the strict `{id,cell,jittered_lat,jittered_lng,t,source}` record) is the project's highest-priority guarantee and is currently the tested source of truth. So the sender must NOT re-implement privacy ad hoc. Options for the next loop's `loop-plan` to weigh:
1. **Embed JavaScriptCore** and call the *unchanged* TS core (compiled to JS) from Swift — preserves the tested privacy guarantee verbatim; Swift owns only hotkey/tray/IPC. (Preferred — honors "reuse, don't rewrite".)
2. **Port the privacy core to Swift** with a parallel property-test suite proving parity with the TS tests (stored/displayed coords never equal raw input, jitter bounded + per-signal randomized, no raw GPS/identity persisted). Higher effort + a second thing to keep correct.
3. Native shell renders into a `WKWebView` hosting the existing Leaflet build (reuses UI + JS core), and `NSStatusItem` + a global hotkey (e.g. `MASShortcut`/Carbon hotkey API) fire `sendSignal()` over the JS bridge. (Closest to ISSUE-...1310's "thin shell" framing, applied natively.)

## Acceptance criteria (to be refined by loop-plan)
- [ ] Menu-bar (`NSStatusItem`) app launches hidden/quiet; tray menu with show/hide + Quit.
- [ ] **True global hotkey** fires one "I noticed something" signal while the app is unfocused/backgrounded.
- [ ] Signal goes through the **same privacy transform guarantee** (no new privacy code paths that bypass jitter+bucketing); record schema unchanged.
- [ ] Privacy parity is **test-verified** (reuse the TS suite via JSC, or a Swift suite proving equivalence) — privacy stays default-on.
- [ ] Demo still runs offline with no LLM/network at runtime; web app remains the map/view + fallback.

## Notes
- Toolchain present on this Mac (per ISSUE-...1310 probe): Xcode CLT, Swift 6.2, Homebrew, Node 24. No Rust needed for the native route.
- Keep the in-browser Space hotkey + web build intact as the instant demo fallback.
