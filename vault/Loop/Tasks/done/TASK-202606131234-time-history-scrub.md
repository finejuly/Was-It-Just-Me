---
id: 202606131234
title: Timeline activity strip under the scrubber (history/heatmap UX polish)
status: ready
priority: med
source: discovery
created: 2026-06-13
planned: 2026-06-13 (loop #10)
blocked_by: none (platform approved ISSUE-202606131230; scaffold + scrub already shipped)
---

## Summary
GOAL #4 (live + historical views) is functionally shipped: the web app has a live/history
toggle, a working scrubber, demo-mode auto-playback (play/pause/speed), and a k-anonymous
density (heatmap) layer. The remaining **UX gap** is that the scrubber is a *bare* range
input — when scrubbing or watching playback, the operator/user has **no visual sense of
which windows actually contain activity** vs. which are quiet. This makes the historical
replay harder to read on stage and during self-testing.

This loop adds a small **timeline activity strip** (a sparkline of per-window signal
counts) rendered directly under the scrubber, so a glance shows where the activity is and
the operator can scrub straight to it. It reuses the existing, tested window model.

## Why this (loop #10 context)
The toolchain blocker (ISSUE-...1314) is **still pending/unanswered**, so the Swift native
sender stays blocked (TASK-...1313 active, TASK-...1315 candidate). Per the resume plan,
the loop pivots to **web polish on the working demo** so the live demo keeps improving while
awaiting the user's toolchain decision. This is the highest-value remaining web item.

## Scope / plan
1. **Pure core (reuse, don't rewrite):** add a tiny pure helper to `src/core/aggregate.ts`
   — `windowCounts(records, fromT, windowMs, steps)` — that returns an array of per-window
   signal counts on the **same `LIVE_WINDOW_MS` grid the scrubber already steps over** (so
   each bar lines up 1:1 with a scrubber step). It must compose `inWindow` (the existing
   tested half-open `[fromT,toT)` filter) rather than re-deriving binning, so it can never
   reveal finer-than-window precision. Counts only — never per-sender data, never coords.
   - Privacy: this exposes only **per-window aggregate counts**, the same coarsened `t`
     resolution the live view already shows. No new precision is introduced.
2. **UI:** in `main.ts` + `mapView`-adjacent UI, render the strip as lightweight bars/ticks
   under the `#scrubber` (a small inline `<div>`/`<canvas>`-free DOM or styled spans), with
   the currently-viewed window highlighted. Strip updates on every `refresh()` and tracks
   the scrubber position. Hidden when there are no signals. Styled in `styles.css` to match
   the calm palette (muted teal, no reds/alarm).
3. **Keep everything else intact:** live/history toggle, playback, heatmap, geolocation,
   verification mode, the Space hotkey — all unchanged. Web app stays the demo spine.

## Acceptance criteria
- [ ] New pure `windowCounts` in `src/core/aggregate.ts` with `node:test` coverage:
      empty input → all-zero/empty; counts equal the number of records whose `t` falls in
      each `[fromT + i*windowMs, +windowMs)` frame; sums to the in-range record total;
      composes `inWindow` (half-open, no double counting); never reads coords.
- [ ] `npm test` stays green and **increases** (new tests added); `npm run typecheck` clean;
      `npm run build` succeeds.
- [ ] The web app renders an activity strip under the scrubber whose bars align with
      scrubber steps; the current window is visually highlighted; the strip reflects the
      seeded demo timeline (some windows busier than others) and updates while scrubbing
      and during playback.
- [ ] No privacy regression: the strip shows only per-window counts (no per-sender marks,
      no coordinates, no sub-window time precision); verification mode + privacy path
      untouched.
- [ ] `npm run build:core` still produces the JSC bundle unchanged (core change is additive
      and not part of the bridge surface, so the bundle is unaffected); web app untouched
      otherwise.

## Test notes
- Unit-test `windowCounts` deterministically with hand-built records at known `t`s.
- Manual: `npm run dev` → http://localhost:5173/ ; with Demo mode on, the strip should show
  a few populated windows; scrubbing/playback should move the highlight across the bars.

## Privacy considerations
- Reuse the tested `inWindow`; do not invent new binning. Counts are per-window aggregates
  at the existing coarsened-`t` resolution — strictly no finer than the live view already is.
- Strip must never plot or hint at individual signals/coordinates — bars are counts only.

## Outcome — loop #10 (2026-06-13) — DONE
Implemented the timeline activity strip. All acceptance criteria met:
- [x] Pure `windowCounts(records, fromT, windowMs, steps)` added to `src/core/aggregate.ts`
      — composes the tested `inWindow` (half-open, no double-count), counts only, no coords.
      4 new `node:test` cases in `src/core/aggregate.test.ts` (grid alignment, half-open
      boundary + sum, empty/steps<=0 edge cases, out-of-grid + non-positive-window throw).
- [x] `npm test` **57 → 61** (all green); `npm run typecheck` clean; `npm run build` ok.
- [x] Web app renders `#activity-strip` under `#scrubber`: one bar per scrubber step, height
      ∝ per-window count, current window highlighted (`.is-current`), clicking a bar scrubs to
      that window. Bars share the exact LIVE_WINDOW_MS grid the scrubber steps over (refactored
      `currentWindow` to return `{startT, steps, index}`), so they line up 1:1. Updates on every
      `refresh()` — while scrubbing and during playback. Hidden when no signals.
- [x] No privacy regression: strip shows only per-window aggregate counts at the existing
      coarsened-`t` resolution; verification mode + privacy send path untouched.
- [x] `npm run build:core` regenerated → byte-for-byte identical (verified via `git diff --stat`);
      the JSC bundle is unaffected (core change is additive, not part of the bridge surface).
Files: `src/core/aggregate.ts`, `src/core/aggregate.test.ts`, `src/main.ts`, `index.html`, `src/styles.css`.
