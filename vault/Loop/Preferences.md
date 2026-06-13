# Preferences

_Durable conventions/decisions the loop applies every iteration. Maintained by `loop-learn`._

## Stack & platform
- **Platform: Web app** (decided in ISSUE-202606131230). **Language: TypeScript.**
- The privacy/domain **core is a pure, dependency-free module** (`src/core/`) so it runs in browser, Node, and tests unchanged. Tests use the built-in **`node:test`** runner (`npm test`) — no external test deps required. _Why:_ keeps the privacy spine verifiable offline with zero install; honors the "no LLM/network at runtime" PRD rule.
- Web UI (later) will use Vite + an open-source JS map library (Leaflet or MapLibre) — no API-key-gated services, so the demo runs offline.

## Working style
- **Code-first**: prioritize shipping runnable, tested code over additional planning/docs (user feedback, [Review 1](../Reviews/processed/Review%201.md)). _How to apply:_ once a task is plannable, move to Implementation quickly; don't accumulate planning artifacts.
- **Parallelize with subagents**: dispatch independent work (planning, review, and implementation) as multiple subagents to accelerate (user feedback, [Review 2](../Reviews/processed/Review%202.md)). _How to apply:_ keep parallel work **verifiable offline** (pure modules + `node:test`); the orchestrator re-runs the **full** suite to verify integration rather than trusting subagent self-reports.
- **Worktree isolation per implementation subagent**: when an implementation subagent works on a task in parallel with others, run it in its own **git worktree** (`Agent` tool `isolation: "worktree"`) to avoid conflicts (user feedback, [Review 3](../Reviews/processed/Review%203.md)). _Why:_ disjoint file ownership alone is fragile — worktrees guarantee no collision on shared files (package.json, lockfiles, config) and let each task's changes be reviewed/merged independently. _How to apply:_ read/review/planning subagents (no writes) don't need a worktree; any subagent that **writes product code** in parallel does. The orchestrator integrates + runs the full suite after merge. See [loop-implement](../../.claude/skills/loop-implement/SKILL.md).

## Privacy implementation rules (from TASK-202606131231)
- Jitter must be a **uniform-random point within the geohash cell**, never center-biased (leaks center) and never a fixed offset (subtractable). Draw randomness **independently per signal** so repeated signals from one location scatter across the cell (defeats triangulation).
- The persisted/transmitted record holds **only** `{id, cell, jittered_lat, jittered_lng, t, source}` — never raw GPS, identity, or exact timestamp.
- Display via `visibleCells` enforces **k-anonymity** (default K=3) before a cell is shown.
