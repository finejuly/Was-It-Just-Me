---
id: 202606131720
title: Lock map pan/zoom (Review 7) + recenter on each sent signal so a sent dot is always visible
status: done              # candidates → ready → active → done
verified: tests 66/66; tsc+vite build clean; build:core SHA 103c823… byte-for-byte unchanged (privacy path untouched)
type: feature+bugfix
created: 2026-06-13
loop: 16
source: Reviews/Review 7.md ("Don't allow map moving/zoom in/zoom out for now") + ISSUE-202606131705 Response ("The app is open now, but no dot generated after signaling")
milestone: M6 (web-demo polish / reliability)
privacy_impact: none — only disables map interaction + recenters to the ALREADY privacy-safe (jittered/bucketed) record point. No raw coordinate is read, stored, displayed, or derived. No change to transformSignal / aggregation / k-anonymity.
---

## What the user asked / reported
1. **Review 7 (web):** "Don't allow map moving/zoom in/zoom out for now." → the Leaflet
   map should be a fixed, locked view (no drag/pan, no zoom by any input, no zoom control).
2. **ISSUE-202606131705 Response (native re-verify, moved to approved/):** "The app is open
   now, but no dot generated after signaling." → IMPORTANT: this confirms the native shell
   FINALLY LAUNCHES and SHOWS the map (the Loop #15 `invalid type: map` config fix worked).
   The remaining complaint is functional: signaling appeared to produce no visible dot.

## Why these two are handled together
`renderDots` already draws a `circleMarker` per record unconditionally (no k-anon gate on
the dot layer; tests 66/66 green), so a sent signal DOES create a dot. The most plausible
reason the user "sees no dot": the sent dot rendered **outside the current viewport**. The
map centers on `DEMO_CENTER`, but if geolocation resolves to the user's real area the map
recenters there while the seeded demo dots (at `DEMO_CENTER`) sit far off-screen; a single
fresh signal can land outside the visible area with no obvious motion to notice it. Once we
LOCK pan/zoom (Review 7), an off-screen dot becomes **unreachable** — so the fix for Review 7
must also guarantee a freshly sent signal is brought into view.

## Plan (web only; native shell unchanged — it just emits `wijm://notice`)
1. **Lock the map (src/ui/mapView.ts):**
   - In the `L.map(...)` options: `zoomControl: false`, `dragging: false`,
     `scrollWheelZoom: false`, `doubleClickZoom: false`, `boxZoom: false`,
     `keyboard: false`, `touchZoom: false`. Also `this.map.dragging.disable()` etc. defensively
     after construction is unnecessary if options cover it, but set the options to be explicit.
   - Pin zoom: keep `INITIAL_ZOOM`; since zoom is fully disabled the min/max are moot but leave
     them as-is so the privacy cap still documents intent.
   - Drop the `+/-` zoom control from the DOM (the `zoomControl: false` option does this).
   - `recenter()` must still work programmatically (we call it on send + on geolocation) —
     `setView` is unaffected by interaction locks, so this keeps working.
2. **Recenter on each sent signal (src/main.ts `sendSignal()`):** after `store.add(record)`,
   call `mapView.recenter(record.jittered_lat, record.jittered_lng)` so the new (privacy-safe)
   dot is centered and unmistakable in the now-fixed view. Uses the jittered/bucketed point
   that is already on the map — never a raw coordinate.
3. **Keep verification + geolocation recenters working** (they already call `recenter`).

## Acceptance criteria
- The map cannot be panned (drag does nothing), cannot be zoomed (wheel / double-click /
  pinch / +/- buttons / keyboard all inert), and shows no zoom control.
- Sending a signal (button, Space hotkey, or native tray/global-shortcut → same `sendSignal`)
  recenters the map on the new dot, so the dot is visibly present after signaling.
- `npm test` stays green (66/66). `npm run build` (tsc) typechecks clean.
- `npm run build:core` privacy-core bundle SHA is byte-for-byte UNCHANGED (proves no privacy
  path touched).
- No raw coordinate is read/stored/displayed anywhere new; privacy invariants intact.

## Test notes
- Existing tests cover the pure cores (privacy/aggregate/sim/answer) and don't render Leaflet,
  so map-interaction options aren't unit-testable here; rely on tsc + the unchanged-core SHA +
  a human glance. The recenter call is a one-liner on the existing `recenter` path.
- Verify SHA unchanged before/after to prove the privacy core bundle is untouched.
