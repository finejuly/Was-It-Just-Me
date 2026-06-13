---
name: loop-create-task
description: Creates Loop tasks from approved issues (Issues/approved/) and default settings, plus actionable review findings, writing well-formed task files into Tasks/candidates/. Invoked by loop-orchestrate during triage and by discovery; planning later promotes candidates to ready.
---

# Loop Create Task

Turns approved work and findings into trackable task files. New tasks land in `vault/Loop/Tasks/candidates/` (planning promotes them to `ready` later).

## Sources
- `vault/Loop/Issues/approved/` — each approved issue should yield one or more tasks.
- Actionable items in `vault/Reviews/` (during orchestrator triage).
- Default settings: `vault/Loop/Preferences.md` (conventions) and `vault/Loop/GOAL.md` (priority).

## Task file format
Path: `vault/Loop/Tasks/candidates/TASK-<id>-<slug>.md` where `<id>` is a timestamp from `date +%Y%m%d%H%M`.

```markdown
---
id: <id>
title: <short imperative title>
status: candidate            # candidate → ready → active → done
priority: <high|med|low>     # from GOAL ordering
source: <ISSUE-... | REVIEW-... | discovery>
created: <YYYY-MM-DD>
---

## Summary
<what & why, tracing to PRD/GOAL>

## Scope / notes
<initial scope, constraints, privacy considerations>

## Acceptance criteria
- [ ] <to be refined by loop-plan>
```

## Rules
- De-duplicate against existing `Tasks/*` before creating.
- One task = one coherent unit of work; split large approved issues into several candidates.
- After creating tasks from an approved issue, note the task id(s) on the issue so it can be considered consumed.

## Output
- New files in `Tasks/candidates/` + a list of created task ids returned to the caller.
