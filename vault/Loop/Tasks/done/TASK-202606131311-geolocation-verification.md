---
id: 202606131311
title: Real geolocation + off-by-default verification mode (fix >3km location report)
status: done
priority: high
source: Review 5 (item 2)
created: 2026-06-13
completed: 2026-06-13
implemented_by: workflow review5-actionables (impl subagent + adversarial privacy verify)
---

## Summary
User testing reported the displayed location was >3 km off their actual location, and asked — for verification — to first remove the randomness and show the exact location. Addressed both.

## Root cause (confirmed)
The app **never read real geolocation**: `MapView`, `loadDemo()`, and `sendSignal()` all used the fixed `DEMO_CENTER` (downtown SF) + simulator (zero `navigator.geolocation` usage in `src`). A tester outside SF saw the demo, not themselves — a discrepancy far larger than 3 km. The privacy transform is **not** the cause: jitter is uniform *within* the same geohash cell as the raw point, so it can displace a dot by at most ~one cell diagonal (~1.1–1.3 km at precision 6) — never >3 km. No lat/lng-order bug (geohash + Leaflet ordering checked).

## Changes
- `src/ui/geo.ts` (new): promise wrapper over `navigator.geolocation.getCurrentPosition` with categorized errors (unsupported/denied/unavailable/timeout).
- `src/main.ts`: `sendSignal()` uses the real fix via `transformSignal(..., "real")` (default privacy) when available; falls back to `triggerSignal(DEMO_CENTER, ...)` with a calm toast on denial/unavailability; map recenters on the real location when granted.
- `src/ui/mapView.ts`: `showExactLocation()` on a dedicated layer (verification mode only).
- `index.html` + `src/styles.css`: off-by-default "Verification mode" checkbox + red `role=alert` banner "⚠ Verification mode: privacy OFF — exact location shown".

## Verification mode (privacy-critical, audited)
OFF by default (forced off at boot regardless of cached form state). When ON: requests a fresh fix and plots the **exact raw** lat/lng (bypassing jitter/bucketing/coarsening/k-anon) on a separate layer that **never writes to the SignalStore**. Toggling off clears it. The normal/default send path is unchanged and always routes through `transformSignal` with `DEFAULT_CONFIG`.

## Verification
- `npm run typecheck` clean · `npm run build` ✓ · `npm test` → **42/42** (core/sim unchanged; `git diff` over `src/core`+`src/sim` empty).
- **Adversarial privacy verifier (workflow phase 2): PASS** — privacy defaults intact, verification off by default, normal mode uses the transform, build + tests pass, no problems.
- **Not auto-verified**: live `navigator.geolocation` (needs a browser + permission + secure context). Manual check recommended at http://localhost:5173/: allow → recenters on real area (dots still jittered); deny → calm message + demo center; toggle Verification → red banner + exact point.
