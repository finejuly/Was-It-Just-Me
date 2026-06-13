---
name: loop-goal
description: Generates and resyncs Loop/GOAL.md from Loop/PRD.md — distilling the PRD into prioritized, measurable goals and milestones that drive what the loop works on next. Run after loop-prd whenever the PRD changes.
---

# Loop Goal Generation

Distills `vault/Loop/PRD.md` into `vault/Loop/GOAL.md`: the prioritized objectives the loop steers by. Run after any PRD change so goals never drift from requirements.

## Inputs
- `vault/Loop/PRD.md` (authoritative).
- `vault/Loop/Progress.md` — to mark already-met goals.

## What to produce
Write `vault/Loop/GOAL.md` containing:
1. **North-star** — one sentence on what success looks like (anchored to the hackathon demo).
2. **Prioritized goals** — ordered list; each goal is specific and measurable, with an acceptance signal. Keep them outcome-focused, not task-level.
3. **Milestones** — coarse sequencing (e.g., MVP map + signal action → privacy jitter → history/scrub → demo mode → polish).
4. **Out of scope** — mirror PRD non-goals so the loop doesn't chase them.

## Rules
- Goals must trace back to PRD sections; don't invent scope.
- Prioritize toward a demo-able MVP first (this is a hackathon submission).
- This skill writes only `GOAL.md`.

## Output
- Updated `GOAL.md` + summary of goal changes returned to the orchestrator.
