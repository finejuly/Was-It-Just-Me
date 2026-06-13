---
name: loop-progress
description: Writes/updates Loop/Progress.md and appends a dated entry to Run Log/ at the end of each loop. Invoked by loop-orchestrate (which owns Progress.md). Captures current status, what changed this loop, what's blocked, and what's next.
---

# Loop Progress Writer

Records the loop's running state. The orchestrator owns `Progress.md`; this skill performs the write consistently and appends the run-log entry.

## Inputs
- The orchestrator's summary of this loop (modules run, tasks/issues/reviews changed).
- `vault/Loop/Tasks/*` and `vault/Loop/Issues/*` counts for the snapshot.

## What to write

### `vault/Loop/Progress.md` (current state — overwrite/refresh)
```markdown
# Progress

_Last updated: <YYYY-MM-DD HH:MM>_

## Status
<one-paragraph where-we-are>

## Snapshot
- Tasks: candidates <n> · ready <n> · active <n> · done <n>
- Issues: pending <n> · approved <n> · rejected <n>
- PRD/GOAL: <in sync | needs update>

## Now / Next
- <next priorities, traced to GOAL>

## Blocked
- <blockers + the ISSUE-... gating them, or "none">
```

### `vault/Run Log/loop-<NN>.md` (one file per loop)
Write a **new file per loop iteration** (not per day): `vault/Run Log/loop-<NN>.md`, zero-padded, where `<NN>` is the next loop number (scan the folder for the highest existing `loop-*.md`). Each file: title `# Loop #<N> — <YYYY-MM-DD HH:MM>`, then which modules ran, what changed, decisions raised, and the stop reason (incl. if the issue gate blocked the loop).

## Rules
- `Progress.md` reflects *current* state (refresh it); each `Run Log/loop-<NN>.md` is *history* for one iteration (write once, don't rewrite past loops).
- Use the real date/time via `date`.
- _Convention set by Review 5: one Run Log file per loop, not per day._

## Output
- Updated `Progress.md` + appended run-log entry.
