---
id: 202606131312
title: Demo-mode stage playback controls (play / pause / speed over the seeded timeline)
status: done
priority: high
source: orchestrator (loop #8, GOAL M5 "stage controls")
created: 2026-06-13
completed: 2026-06-13
goal: M5 — Demo mode (stage controls: pause/resume/speed)
---

## Summary
Make the seeded historical timeline **auto-replay hands-free** on stage. The app already had a manual scrubber over an hour of seeded demo history; this adds **Play/Pause** and a **speed selector (1×/2×/4×)** that advance the scrubber automatically, so an operator can demo "historical replay" (PRD Simulation mode) without keeping a hand on the slider. Loops back to the start of history when it reaches the end so an unattended stage demo keeps cycling.

## What shipped
- **New pure, tested module** `src/sim/playback.ts`: `advancePlayback(current, maxStep, speed, elapsedMs, carryMs)` — a deterministic clock that maps wall-clock elapsed + speed to scrubber-step advancement, with clamping, forward-only motion, end detection, and sub-step carry. No DOM/timer/network/privacy data (pure). `PLAYBACK_SPEEDS = [1,2,4]`, `BASE_STEPS_PER_SECOND = 1`.
- **Tests** `src/sim/playback.test.ts`: 8 cases (speed scaling, clamping, no-backward, single-frame end, carry accumulation, typed speeds). Suite now **50/50** (was 42; +8).
- **UI wiring** `src/main.ts`: owns only the `setInterval` ticker (100 ms) + DOM; delegates stepping to `advancePlayback`. Play starts from history if at live; manual scrub / "Back to live" / leaving demo mode all stop playback. Speed change resets carry.
- **Markup** `index.html`: a `.playback-row` (Play button + speed `<select>`) inside the time panel, shown only while Demo mode is on.
- **Styles** `src/styles.css`: `.playback-row`, `.speed-select`, pressed-state for `#play-btn`.

## Privacy / preferences posture
- Playback is **demo-only** and **starts paused** (no auto-motion until the operator presses Play). It only moves the *view cursor*; it never touches `transformSignal` or the privacy-safe store/render path, and reveals no finer precision than the existing scrubber. Verification mode and privacy defaults are unchanged.
- Reused the pure cores unchanged: `core/*` and `sim/simulator.ts` tested defaults were **not** modified.

## Verification (loop #8)
- `npm run typecheck` — clean.
- `npm run build` — ok (17 modules; `tsc --noEmit && vite build`).
- `npm test` — **50/50 passing**.
- **Not verified**: live browser behavior (button click → cursor motion on the running dev server) was not manually observed this loop; left to the user. Dev server already running at http://localhost:5173/.

## Remainder (left as candidate)
History/heatmap UX polish (nicer heatmap, live↔history affordances) remains in TASK-202606131234 (candidate). Optional follow-ups: a small time-position label during playback, or persistence for replay after reload (PRD MVP #8).
