---
name: loop-discovery
description: Discovery module for the Loop. Dispatched by loop-orchestrate to explore the PRD, GOAL, current state, and Info/Resources.md, then surface gaps, opportunities, and risks as candidate tasks (Tasks/candidates/) or pending issues. Read-only with respect to product code.
---

# Loop Discovery Module

Dispatched by `loop-orchestrate` (ideally as a subagent). Your job is to find *what should be worked on next* — you do not write product code.

## Inputs
- `vault/Loop/PRD.md`, `vault/Loop/GOAL.md` — what we're building and why.
- `vault/Loop/Progress.md`, latest `vault/Run Log/` — where we are.
- `vault/Loop/Tasks/*`, `vault/Loop/Issues/*` — what's already tracked (avoid duplicates).
- `vault/Info/Resources.md` — reference material and external docs.
- The product code tree (read-only) once it exists.

## What to do
1. Compare current state against PRD/GOAL. Identify gaps: missing MVP requirements, untested areas, privacy risks, demo-mode coverage holes, broken/blocked items.
2. De-duplicate against existing `Tasks/*` and `Issues/*` before proposing anything new.
3. For each concrete, actionable gap → propose a **candidate task** via `loop-create-task` (or write directly to `vault/Loop/Tasks/candidates/`).
4. For anything needing a user decision or carrying ambiguity/risk → raise a **pending issue** via `loop-create-issue`.
5. Write a short discovery note (findings + rationale) so the orchestrator can see your reasoning. Do not edit `PRD.md`, `GOAL.md`, or `Progress.md` — those are orchestrator/`loop-prd`-owned.

## Output
- New files in `Tasks/candidates/` and/or `Issues/pending/`.
- A discovery findings note returned to the orchestrator (your final message = structured summary: gaps found, candidates proposed, issues raised).
