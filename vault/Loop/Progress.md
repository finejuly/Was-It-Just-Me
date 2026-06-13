# Progress

_Last updated: 2026-06-13 (loop #8)_

## Status
Staying on the **web app** — the standalone-sender pivot (ISSUE-...1310) was rejected by the user (moved to `Issues/rejected/`). Loop #8 shipped the next demo-spine increment: **demo-mode stage playback** (Play/Pause + 1×/2×/4× speed) that auto-advances the seeded historical timeline, so "historical replay" runs hands-free on stage (GOAL M5). Stepping logic is a new pure, tested module; UI owns only the ticker. Tests up to 50/50.

A genuine conflict was surfaced rather than guessed: the rejected ISSUE-...1310 file also carried a hand-written note "Implement Native menu-bar app" (Option 3), which contradicts both its `rejected/` location and the "reuse, don't rewrite" preference. Loop #8 did **not** start a native app; it annotated ...1310 honestly and raised **ISSUE-...1312** asking the user to confirm intent (recommend: stay web; if standalone is wanted, Tauri/Electron over a native rewrite).

## Snapshot
- Tasks: candidates 1 (TASK-...234 history/heatmap UX) · ready 0 · active 0 · done 5
- Issues: pending 1 (ISSUE-...1312 native-app annotation conflict) · approved 2 · rejected 2 (ISSUE-...1302 offline basemap, ISSUE-...1310 standalone app)
- Reviews: 0 pending (5 processed)
- App: builds; `npm run dev` → http://localhost:5173/ ; **tests 50/50**; geolocation + verification mode (off by default) + demo stage playback added
- Issue gate: 1/10 — clear · config: refresh_minutes=3, unanswered_issue_limit=10

## Now / Next
- **User**: (a) decide **ISSUE-...1312** (confirm web vs native/standalone — clears up the contradictory note on ...1310); (b) live-test at http://localhost:5173/ — turn on Demo mode, press **Play history**, try 2×/4×, then scrub manually (should pause) and "Back to live"; also the earlier geolocation + Verification-mode test.
- **Remaining product polish**: history/heatmap UX (TASK-...234) — nicer heatmap, live↔history affordances; optional playback position label / replay persistence.

## Blocked
- None blocking. ISSUE-...1312 only gates a possible platform pivot, not the working web demo.

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it. A fixed-interval cron (`*/3 * * * *`) is more robust within a running session — switchable on request.
