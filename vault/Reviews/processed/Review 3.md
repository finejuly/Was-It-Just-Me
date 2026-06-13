For each subagent for a task, consider to use worktree to avoid potential conflict.

---
**Triaged 2026-06-13 (loop #5):** Process guidance — recorded a durable preference: parallel implementation subagents run in their own git worktree (`Agent` `isolation: "worktree"`); read-only subagents don't need one. Applied going forward (the next parallel code burst will use worktrees instead of relying on disjoint file ownership). The `loop-implement`/`loop-orchestrate` skills already reference worktrees; Preferences now makes it the default. No new task/issue needed.
