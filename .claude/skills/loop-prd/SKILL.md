---
name: loop-prd
description: PRD Maintenance module for the Loop. Reviews and updates Loop/PRD.md from IDEA.md, approved issues, reviews, and learnings, keeping it the single source of truth. Run by/through loop-orchestrate (which owns the final PRD write). After changing the PRD, trigger loop-goal to resync GOAL.md.
---

# Loop PRD Maintenance

Keeps `vault/Loop/PRD.md` the accurate single source of truth. The orchestrator owns the final write to `PRD.md`, so propose precise edits and apply them under orchestrator dispatch.

## Inputs
- [IDEA.md](../../../IDEA.md) — original product brief (authoritative for initial PRD).
- `vault/Loop/Issues/approved/` — approved decisions that change requirements.
- `vault/Reviews/` and `vault/Loop/Preferences.md` — discovered constraints/lessons.

## Initial generation (PRD is empty)
Generate `vault/Loop/PRD.md` from `IDEA.md`. IDEA.md requires these sections — include all of them:
**Product summary · Problem · Target users · Goals · Non-goals · Core UX · Hotkey & background behavior · MVP requirements · Map behavior · Privacy rules · Time/history behavior · Simulation (demo) mode · Data model · Testing requirements.**

Hard constraints to encode (from IDEA.md):
- Lowest-friction "I noticed something" action; no incident classification.
- Privacy-randomized dots (jitter/bucket); raw sender location never inferable.
- Runtime must NOT depend on Claude or any LLM.
- Demo mode is first-class (simulated nearby/false signals, heatmap changes, hotkey triggers, background behavior, historical replay).
- Avoid crime-reporting/surveillance/policing/confirmed-incident framing.

## Ongoing maintenance
- Reconcile the PRD with approved issues, reviews, and learnings. Keep a short changelog at the bottom (date + what changed + why).
- Mark open product questions clearly; if a decision is needed, ensure a pending issue exists (via `loop-create-issue`).

## After any PRD change
Run `loop-goal` to regenerate/resync `GOAL.md`.

## Output
- Updated `PRD.md` + a summary of changes returned to the orchestrator.
