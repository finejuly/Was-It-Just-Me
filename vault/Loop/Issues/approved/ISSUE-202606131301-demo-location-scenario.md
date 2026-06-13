---
id: 202606131301
title: Is the demo location (downtown SF) and scenario the one you want for the live demo?
status: approved
type: decision
created: 2026-06-13
resolved: 2026-06-13
decision: Option 1 — keep downtown SF (default accepted)
raised_by: loop-orchestrate
blocks: none (changeable, but sooner is cheaper)
---

> **Resolved 2026-06-13 (loop #6):** User approved without changes → **Option 1, keep downtown SF**. No code change needed (current default). Scenario density (Option 3) remains tunable later if desired.


## Context
The app now runs (http://localhost:5173/). The demo currently centers on **downtown San Francisco** (`37.7749, -122.4194`), seed `20260613`, with ~12 nearby + ~8 scattered "false" signals over a 1-hour timeline (`src/ui/config.ts`, `src/sim/simulator.ts`). These defaults shape the whole on-stage story and are easy to change now, harder once we tune visuals around them.

## Options
1. **Keep downtown SF** as a neutral, recognizable demo neighborhood.
2. **Use a specific city/neighborhood** you'll reference on stage (give lat/lng or a place name).
3. **Tune scenario density/cadence** (more/fewer signals, faster arrival, longer timeline) for a punchier demo.

## Recommendation
Confirm a location you're comfortable narrating (Option 1 is a fine default). If you have a target city for the pitch, tell me the place and I'll set the center + seed. Scenario density (Option 3) can be tuned independently once you've watched a run.

## How to answer
Move this file to `Issues/approved/` (with the location/params noted) or `Issues/rejected/`, or just reply.
