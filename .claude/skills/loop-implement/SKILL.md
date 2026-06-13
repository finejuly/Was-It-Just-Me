---
name: loop-implement
description: Implementation module for the Loop — the ONLY module allowed to modify product code, run tests, and commit. Dispatched by loop-orchestrate to take a ready task (Tasks/ready/) through active to done, implementing the plan, verifying acceptance criteria, and committing small changes.
---

# Loop Implementation Module

The **only** module that may modify product code, run tests, and commit. Dispatched by `loop-orchestrate` against a specific `ready` task.

## Inputs
- A task in `vault/Loop/Tasks/ready/` (with plan + acceptance criteria).
- `vault/Loop/PRD.md`, `vault/Loop/Preferences.md` — requirements and conventions.
- The product code tree (read/write).

## Procedure
1. **Claim** the task: set frontmatter `status: active` and move it `Tasks/ready/` → `Tasks/active/`.
2. **Isolate** if running concurrently with other implementation work: use a dedicated git worktree (see EnterWorktree) so parallel tasks don't collide. Solo work can run on a normal branch.
3. **Implement** the plan. Match existing code style and conventions. Respect PRD privacy rules and non-goals (no exact-location exposure, no LLM/Claude runtime dependency, demo mode must keep working).
4. **Test**: run the project's tests/build. Add tests for new behavior (including demo-mode paths where relevant). If tests don't exist yet, scaffold the test setup as part of the task.
5. **Verify** each acceptance criterion explicitly. If a criterion can't be met, stop, record why in the task, and raise a pending issue via `loop-create-issue` rather than marking it done.
6. **Commit** small, focused changes with clear messages. Do not push or open PRs unless the task/orchestrator says to.
7. **Close**: record outcome (what changed, test results) in the task body, set `status: done`, and move it `Tasks/active/` → `Tasks/done/`.

## Rules
- Never mark a task `done` with failing tests or unmet acceptance criteria — report honestly.
- Don't edit `PRD.md`, `GOAL.md`, or `Progress.md`; those are orchestrator-owned. Surface needed changes as tasks/issues.

## Output
- Code changes + commits, updated task file in `Tasks/done/`, and a summary (files changed, tests run + results, criteria met) returned to the orchestrator.
