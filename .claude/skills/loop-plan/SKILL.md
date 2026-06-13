---
name: loop-plan
description: Planning module for the Loop. Dispatched by loop-orchestrate to turn candidate tasks (Tasks/candidates/) into well-specified, ready-to-implement tasks (Tasks/ready/) with an implementation plan, acceptance criteria, and test notes. Does not modify product code.
---

# Loop Planning Module

Dispatched by `loop-orchestrate` (good subagent candidate). You convert rough candidate tasks into actionable, verifiable plans. You do **not** write product code.

## Inputs
- `vault/Loop/Tasks/candidates/*` — tasks to plan.
- `vault/Loop/PRD.md`, `vault/Loop/GOAL.md` — requirements and priorities.
- `vault/Loop/Preferences.md` — conventions/decisions to honor.
- Existing product code (read-only) for context.

## What to do
For each candidate you're asked to plan (highest priority first, per GOAL):
1. Clarify scope. If it's too big, split into multiple ready tasks; if it's ambiguous or needs a user decision, raise a pending issue via `loop-create-issue` and leave the candidate unplanned.
2. Write/extend the task's body with:
   - **Plan**: ordered implementation steps, files likely touched, dependencies on other tasks.
   - **Acceptance criteria**: observable, testable conditions for "done".
   - **Test notes**: what to test and how (including demo-mode behavior where relevant).
   - **Risks / privacy considerations**.
3. Update the task frontmatter `status: ready` and **move the file** from `Tasks/candidates/` to `Tasks/ready/`.

## Rules
- Never set a task to `ready` if it lacks acceptance criteria.
- Honor PRD non-goals and privacy rules — plans must not introduce exact-location exposure or LLM runtime dependencies.

## Output
- Updated task files moved into `Tasks/ready/`.
- Summary returned to orchestrator: which candidates were planned, split, or deferred (with issue refs).
