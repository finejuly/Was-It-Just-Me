---
id: 202606131233
title: App scaffold + map view rendering privacy-randomized dots
status: candidate
priority: med
source: discovery
created: 2026-06-13
blocked_by: ISSUE-202606131230
---

## Summary
Stand up the application scaffold and the map view that renders seeded signals as jittered/bucketed dots (GOAL #3, milestone M1). **Blocked** until the platform decision (ISSUE-202606131230) is resolved, since the stack determines the scaffold.

## Scope / notes
Per [PRD.md](../../PRD.md) (Core UX, Map behavior): render recent signals as dots at jittered/bucketed positions, recency fade, pan/zoom with zoom capped at bucket resolution (never reveal finer-than-bucket precision). Consumes the signal-core module (TASK-202606131231). Heatmap layer can be a follow-up task.

## Acceptance criteria
- [ ] To be refined by `loop-plan` after the platform is chosen — must show dots at non-true coordinates and cap zoom at bucket precision.
