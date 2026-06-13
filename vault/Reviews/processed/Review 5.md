1. Please make a separated Run Log file for each loop, rather than each day.
2. When I tested it, it appeared to display a location different from my actual one (by more than 3 km). Please check this; for verification purposes, please first remove the randomness and ensure it displays the exact location.
3. Signal transmission should be implemented via a standalone app rather than the web; accessing the web to send a signal after detecting something would be too slow.

---
**Triaged 2026-06-13 (loop #7):** All three acted on.
1. **Run Log per loop** — split the daily `2026-06-13.md` into `loop-01.md`…`loop-06.md`, removed the daily file, and updated the convention in [loop-progress](../../.claude/skills/loop-progress/SKILL.md), [Vault-Map](../../Info/Vault-Map.md), and CLAUDE.md.
2. **Location / verification** — root cause: app used the fixed SF demo center, never real geolocation (jitter could only ever be ≤~1.3 km, so not the cause). Implemented real geolocation + an off-by-default, clearly-bannered Verification mode showing the exact location. Adversarial privacy check passed; 42/42 tests. See TASK-202606131311.
3. **Standalone app** — raised ISSUE-202606131310 (Tauri vs Electron vs native; recommend Tauri v2), which revisits the web-app platform decision (ISSUE-202606131230). Awaiting your choice before building the sender shell.
