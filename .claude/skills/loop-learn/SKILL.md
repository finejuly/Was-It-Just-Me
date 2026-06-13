---
name: loop-learn
description: Learning module for the Loop. Dispatched by loop-orchestrate to extract durable lessons from completed tasks, reviews, and rejected issues, then record them as preferences/conventions in Preferences.md so future loops apply them automatically. Does not modify product code.
---

# Loop Learning Module

Dispatched by `loop-orchestrate` (good subagent candidate). You turn what happened into what we should always do next time, reducing repeated mistakes and context re-explanation.

## Inputs
- `vault/Loop/Tasks/done/` — what shipped and how.
- `vault/Reviews/` — recurring findings/anti-patterns.
- `vault/Loop/Issues/rejected/` — decisions the user declined (and why).
- `vault/Loop/Progress.md`, `vault/Run Log/` — trajectory.

## What to do
1. Identify durable, reusable lessons: conventions to adopt, pitfalls to avoid, decisions already made (so they aren't re-litigated).
2. Append concise, actionable entries to `vault/Loop/Preferences.md` — each as a clear rule with a one-line rationale. Avoid one-off trivia; only record things that should influence *future* loops.
3. If a lesson implies a PRD change, recommend it (raise a task/issue) rather than editing the PRD yourself.

## Rules
- `Preferences.md` is yours to append to; do not edit `PRD.md`, `GOAL.md`, or `Progress.md`.
- Keep it lean — prune contradictions and duplicates as you add.

## Output
- Updated `Preferences.md` and a summary of lessons recorded, returned to the orchestrator.
