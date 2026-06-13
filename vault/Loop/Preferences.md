# Preferences

_Durable conventions/decisions the loop applies every iteration. Maintained by `loop-learn`._

## Stack & platform
- **Platform: Web app** (decided in ISSUE-202606131230). **Language: TypeScript.**
- The privacy/domain **core is a pure, dependency-free module** (`src/core/`) so it runs in browser, Node, and tests unchanged. Tests use the built-in **`node:test`** runner (`npm test`) — no external test deps required. _Why:_ keeps the privacy spine verifiable offline with zero install; honors the "no LLM/network at runtime" PRD rule.
- Web UI (later) will use Vite + an open-source JS map library (Leaflet or MapLibre) — no API-key-gated services, so the demo runs offline.

## Working style
- **Code-first**: prioritize shipping runnable, tested code over additional planning/docs (user feedback, [Review 1](../Reviews/processed/Review%201.md)). _How to apply:_ once a task is plannable, move to Implementation quickly; don't accumulate planning artifacts.

## Privacy implementation rules (from TASK-202606131231)
- Jitter must be a **uniform-random point within the geohash cell**, never center-biased (leaks center) and never a fixed offset (subtractable). Draw randomness **independently per signal** so repeated signals from one location scatter across the cell (defeats triangulation).
- The persisted/transmitted record holds **only** `{id, cell, jittered_lat, jittered_lng, t, source}` — never raw GPS, identity, or exact timestamp.
- Display via `visibleCells` enforces **k-anonymity** (default K=3) before a cell is shown.
