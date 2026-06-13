# Progress

_Last updated: 2026-06-13 13:01_

## Status
**The app is runnable and user-testable.** Loop #6 built the web UI (TASK-202606131233, Vite + TS + Leaflet) wiring the tested core/sim/aggregate modules, verified it (typecheck + build + 42 tests), and **launched the dev server at http://localhost:5173/**. Acting on Review 4, prioritized reaching a testable build and proactively raised two decision issues. The end-to-end demo spine (privacy core → simulator → map + density + scrubber + hotkey send) now exists.

## Snapshot
- Tasks: candidates 1 (TASK-...234 UI remainder) · ready 0 · active 0 · done 3
- Issues: pending 2 (demo location ...1301, offline basemap ...1302) · approved 1 · rejected 0
- Reviews: 0 pending (4 processed)
- App: builds (`dist/`), `npm run dev` → http://localhost:5173/ ; tests 42/42
- Issue gate: 2/5 — clear
- config: refresh_minutes=3 (180s cadence)

## Now / Next
- **User testing**: please open http://localhost:5173/ and give practical feedback (drop notes in `vault/Reviews/`).
- **Awaiting decisions**: ISSUE-...1301 (demo location/scenario), ISSUE-...1302 (offline basemap).
- **Next build**: TASK-202606131234 UI remainder is largely covered (scrubber + density shipped in the scaffold); a focused pass on history/live UX polish + heatmap visualization is the main remaining product work. Background/global-hotkey (desktop) is out of scope for the web MVP unless revisited.

## Blocked
- None. Two open decision issues are advisory (don't block testing).
