---
id: 202606131233
title: App scaffold + map view rendering privacy-randomized dots
status: done
priority: med
source: discovery
created: 2026-06-13
planned: 2026-06-13
completed: 2026-06-13
unblocked: ISSUE-202606131230 resolved (web app / TypeScript)
implemented_by: implementation subagent (loop #6)
---

## Summary
Stand up the application scaffold and the map view that renders seeded signals as jittered/bucketed dots (GOAL #3, milestone M1). **Blocked** until the platform decision (ISSUE-202606131230) is resolved, since the stack determines the scaffold.

## Scope / notes
Per [PRD.md](../../PRD.md) (Core UX, Map behavior): render recent signals as dots at jittered/bucketed positions, recency fade, pan/zoom with zoom capped at bucket resolution (never reveal finer-than-bucket precision). Consumes the signal-core module (TASK-202606131231). Heatmap layer can be a follow-up task.

## Plan (loop #6)
Stack: **Vite + TypeScript + Leaflet** (network confirmed available). Wire the existing pure core/sim/aggregate modules into a working web app:
- Vite scaffold: `package.json` (vite, typescript, leaflet, @types/leaflet), `vite.config.ts`, `tsconfig.json`, `index.html`, `src/styles.css`.
- `src/main.ts`: Leaflet map; run `generateScenario` (demo); render signal dots at `jittered_*`; density layer via `densityGrid` (k-anon already applied); live/demo state; "I noticed something" button + spacebar hotkey → `triggerSignal`; time scrubber via `timeBounds`/`windowsOf`/`inWindow`.
- Tiles: OSM (graceful degradation — dots render even if tiles fail, satisfying "works offline").

## Acceptance criteria
- [x] App builds: `npm run build` (vite) + `npm run typecheck` (tsc --noEmit) succeed → emits `dist/`.
- [x] Map renders demo signals as dots at `jittered_lat/lng` (sim routes through the privacy transform; no raw coords exist).
- [x] Density layer uses `densityGrid` (sub-k cells never shown).
- [x] "I noticed something" button + spacebar hotkey fire `triggerSignal`.
- [x] Time scrubber filters via `inWindow`; existing 42 tests stay green.

## Result — done 2026-06-13 (loop #6, implementation subagent)
Vite + TypeScript + Leaflet app wiring the pure core/sim/aggregate modules (unmodified):
- `index.html`, `vite.config.ts`, `tsconfig.json`, `src/styles.css`
- `src/ui/config.ts` (demo center = downtown SF `37.7749,-122.4194`, seed `20260613`, `MAX_ZOOM=16`), `src/ui/store.ts` (in-memory SignalRecord store), `src/ui/mapView.ts` (Leaflet dots + density circleMarkers, OSM tiles w/ error fallback)
- `src/main.ts`: demo scenario, scrubber over `timeBounds`/`inWindow`, live/history + "back to live", "I noticed something" button + spacebar → `triggerSignal`, demo + density toggles
- `package.json` deps + `dev`/`build`/`typecheck`/`preview` scripts; `package-lock.json`

**Verified (orchestrator, on main after merge):** `npm run typecheck` clean · `npm run build` ✓ (dist emitted) · `npm test` → 42/42 · `npm run dev` serves HTTP 200 at http://localhost:5173/.
**Not verified:** live browser interaction (map render, scrubber drag, hotkey send, tile load/fallback) — left for user testing per Review 4.
**Privacy:** only `jittered_*`/cell-centers rendered; `maxZoom` capped at bucket precision; sub-k cells excluded.

Follow-ups raised as issues: demo location/scenario (ISSUE-202606131301), offline basemap strategy (ISSUE-202606131302).
