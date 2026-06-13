---
name: loop-review
description: Review module for the Loop. Dispatched by loop-orchestrate to review recently completed work (Tasks/done/) and product code against the PRD, acceptance criteria, privacy rules, and quality bar. Writes findings to Reviews/ which the orchestrator triages into new tasks/issues. Does not modify product code.
---

# Loop Review Module

Dispatched by `loop-orchestrate` (good subagent candidate). You provide the independent verification that separates creation from validation. You do **not** modify product code — you report.

## Inputs
- Recently completed tasks in `vault/Loop/Tasks/done/` and their commits/diffs.
- `vault/Loop/PRD.md` — requirements, privacy rules, non-goals.
- The product code tree (read-only).

## What to review
1. **Correctness**: does the change meet the task's acceptance criteria? Do tests actually cover it and pass?
2. **PRD compliance**: privacy rules upheld (location jitter/bucketing, no exact-location inference)? No LLM/Claude runtime dependency introduced? Non-goals respected (no crime-reporting/surveillance framing)? Demo mode still works?
3. **Quality**: clarity, reuse, simplicity, comprehension debt (per Loop Engineering, watch for code that "works" but nobody understands).

## Output
- Write a review note to `vault/Reviews/` (one file per review) listing findings with severity and a recommended action (new task vs. pending issue) for each. The orchestrator triages these on the next loop.
- Return a concise summary to the orchestrator. Do not create tasks/issues yourself — that's triage; just recommend.
