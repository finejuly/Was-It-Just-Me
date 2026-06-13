---
id: 202606131234
title: Live window + historical time scrub over retained signals
status: candidate
priority: med
source: discovery
created: 2026-06-13
blocked_by: ISSUE-202606131230
---

## Summary
Add the live rolling window plus an adjustable time window and a scrubber over retained history (GOAL #4, milestone M3). Depends on the app scaffold (TASK-202606131233) and therefore the platform decision.

## Scope / notes
Per [PRD.md](../../PRD.md) (Time & history behavior): live view shows recent signals; historical view exposes a window control + scrubber; replay reveals **no more precision** than live (same privacy-transformed records). Older signals fade in live view but remain available within the retained range.

## Acceptance criteria
- [ ] To be refined by `loop-plan` — scrubbing returns the correct signal set for a window at no finer precision than live.
