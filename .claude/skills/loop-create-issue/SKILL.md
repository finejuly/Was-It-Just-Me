---
name: loop-create-issue
description: Creates approval/rejection-oriented issues in Issues/pending/ whenever the loop needs a user decision (scope, product direction, risky changes, blockers). Used by loop-orchestrate and any module. The user moves issues to Issues/approved/ or Issues/rejected/; pending count gates implementation via unanswered_issue_limit.
---

# Loop Create Issue

Raises a decision to the user. Issues are the human-in-the-loop gate: the orchestrator halts implementation when `Issues/pending/` exceeds `unanswered_issue_limit` (see `config.md`).

## When to create one
- A product/scope decision the PRD doesn't settle.
- A risky or irreversible change needing sign-off.
- A blocker that needs user input to proceed.
- An ambiguity discovery/planning/review can't resolve safely.

## Issue file format
Path: `vault/Loop/Issues/pending/ISSUE-<id>-<slug>.md` where `<id>` is `date +%Y%m%d%H%M`.

```markdown
---
id: <id>
title: <the decision, phrased as a question>
status: pending             # pending → approved | rejected (user moves the file)
type: <approval|decision|blocker|question>
created: <YYYY-MM-DD>
raised_by: <loop-discovery|loop-plan|loop-review|loop-orchestrate|...>
blocks: <TASK-... or "none">
---

## Context
<why this came up, with PRD/GOAL refs>

## Options
1. <option A — implication>
2. <option B — implication>

## Recommendation
<your suggested option + rationale>
```

## Rules
- One decision per issue; phrase the title as a clear question.
- Always give options + a recommendation so the user can decide fast.
- The **user** moves the file to `Issues/approved/` or `Issues/rejected/`. Approved issues feed `loop-create-task`; rejected issues feed `loop-learn`.

## Output
- New file in `Issues/pending/` + the issue id returned to the caller.
