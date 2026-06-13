---
name: loop-orchestrate
description: Main Orchestrator for the Loop Engineering system. Run this to drive one loop iteration — read vault state, apply config, triage Reviews, gate on pending issues, and dispatch the useful modules (discovery, planning, implementation, review, learning, PRD maintenance). Owns final updates to Progress.md, PRD.md, and global state.
---

# Loop Orchestrator

You are the **Main Orchestrator**. One invocation = one loop iteration. The canonical control flow lives in [LOOP.md](../../../LOOP.md); this skill operationalizes it and wires every other Loop skill.

## Vault paths (all relative to repo root)

| Path | Role | Owner skill(s) |
| --- | --- | --- |
| `vault/Loop/config.md` | Runtime config (`refresh_minutes`, `unanswered_issue_limit`) | read by orchestrator |
| `vault/Loop/PRD.md` | Product requirements (source of truth) | `loop-prd` writes; all read |
| `vault/Loop/GOAL.md` | Goals derived from PRD | `loop-goal` writes |
| `vault/Loop/Progress.md` | Running progress log | `loop-progress` writes (orchestrator-owned) |
| `vault/Loop/Preferences.md` | User preferences applied each loop | `loop-learn` writes; orchestrator reads |
| `vault/Loop/Issues/pending/` | Issues awaiting user approval/rejection | `loop-create-issue` writes |
| `vault/Loop/Issues/approved/` | Approved issues → source for tasks | user/orchestrator moves here; `loop-create-task` reads |
| `vault/Loop/Issues/rejected/` | Rejected issues (kept for learning) | user/orchestrator moves here; `loop-learn` reads |
| `vault/Loop/Tasks/candidates/` | Proposed, not-yet-planned tasks | `loop-discovery` + `loop-create-task` write |
| `vault/Loop/Tasks/ready/` | Planned tasks ready to build | `loop-plan` writes; `loop-implement` reads |
| `vault/Loop/Tasks/active/` | Tasks currently being implemented | `loop-implement` moves here |
| `vault/Loop/Tasks/done/` | Completed tasks | `loop-implement` moves here; `loop-review`/`loop-learn` read |
| `vault/Reviews/` | Review findings | `loop-review` writes; orchestrator reads |
| `vault/Run Log/` | Append-only log of loop runs | orchestrator writes |
| `vault/Info/Resources.md` | Reference links | `loop-discovery` reads |

## Procedure (each loop)

1. **Read state**: `config.md`, `PRD.md`, `GOAL.md`, `Progress.md`, `Preferences.md`, everything under `Issues/*` and `Tasks/*`, all of `Reviews/`, and the most recent `Run Log/` entry.
2. **Apply config**: parse `config.md`; hold `refresh_minutes` and `unanswered_issue_limit` for this run.
3. **Triage Reviews**: for each file in `Reviews/`, convert actionable findings into tasks (`loop-create-task`) or issues (`loop-create-issue`), then move the processed review note to a `processed` subfolder or annotate it as triaged so it isn't reprocessed.
4. **Issue gate**: count files in `Issues/pending/`. If `count > unanswered_issue_limit`, do **not** dispatch implementation. Call `loop-progress` to record the block reason, update `Run Log/`, and stop this loop.
5. **Decide modules**: based on state, choose which of these are useful *now* — `loop-discovery`, `loop-plan`, `loop-implement`, `loop-review`, `loop-learn`, `loop-prd`. Typical triggers:
   - PRD missing/stale or GOAL out of sync → `loop-prd` (then `loop-goal`).
   - Few/no `candidates` and approved issues unconsumed → `loop-discovery` and/or `loop-create-task`.
   - `candidates` exist but no `ready` tasks → `loop-plan`.
   - `ready` tasks exist and gate is clear → `loop-implement`.
   - Tasks landed in `done/` since last review → `loop-review`.
   - A review/loop produced reusable lessons → `loop-learn`.
6. **Dispatch**: run only the useful modules. Run independent read/review/planning modules as **subagents** (Agent tool) so they work in parallel; keep implementation serialized per task (use a git worktree per concurrent implementation task — see `loop-implement`).
7. **Module outputs**: modules write to their own task/review/note files. **Only you** (the orchestrator) finalize `Progress.md` (via `loop-progress`), `PRD.md` (via `loop-prd`), and cross-cutting global state. Modules must not edit these directly.
8. **Product code**: only `loop-implement` may modify product code, run tests, and commit. If a non-implementation module wants a code change, it raises a task/issue instead.
9. **Surface decisions**: when user input is required, create a pending issue via `loop-create-issue`.
10. **Close out**: call `loop-progress` to update `Progress.md`; append a dated entry to `Run Log/` summarizing what ran, what changed, and what's blocked. Keep commits small.

## Notes

- This is autonomous-but-supervised: verification stays a human responsibility. When uncertain, prefer raising a pending issue over guessing.
- Re-running this skill is the loop. Cadence (`refresh_minutes`) is enforced by an external automation/scheduler, not by this skill itself.
