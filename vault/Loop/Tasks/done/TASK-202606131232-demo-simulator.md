---
id: 202606131232
title: Demo-mode signal simulator (seeded, controllable scenario)
status: done
priority: high
source: discovery
created: 2026-06-13
completed: 2026-06-13
implemented_by: parallel subagent (loop #4)
---

## Summary
Build the seeded demo-mode simulator that drives the live demo (GOAL #6, milestone M5 — half the demo spine). Core logic is platform-independent and consumes the signal-core module (TASK-202606131231).

## Scope / notes
Per [PRD.md](../../PRD.md) (Simulation mode), simulate: signals appearing nearby over time, scattered false/background signals, heatmap density changes, hotkey-triggered signals (operator fires live), background arrival, and historical replay over a pre-seeded timeline. Must be **seedable/deterministic** with pause/resume/speed controls. All generated signals flagged `source: demo` and isolatable from real signals. Runs fully offline (no network/LLM).

## Acceptance criteria
- [x] Covers each required simulation from the PRD and proves demo data is flagged `source: demo` and separable.

## Result — done 2026-06-13 (loop #4, parallel subagent)
Implemented as a pure, dependency-free module:
- [src/sim/simulator.ts](../../../../src/sim/simulator.ts) — `generateScenario(opts)` (deterministic timeline: nearby cluster + scattered false signals, sorted by `t`), `triggerSignal(center, ts, rng?)` (operator hotkey fire), `mulberry32(seed)` seeded RNG. Raw points are generated around a center then routed through `transformSignal(..., "demo", {rng})` so privacy rules always apply.
- [src/sim/simulator.test.ts](../../../../src/sim/simulator.test.ts) — 12 `node:test` cases: determinism (same seed ⇒ deep-equal; different seed ⇒ differs), all `source: "demo"`, nearby vs false spatial spread, timestamps in range, valid records, trigger fire.

**Verification:** part of full suite `npm test` → **42/42 pass**.
Note: "pause/resume/speed" controls are a UI/playback concern → belongs with the web scaffold (TASK-202606131233), not this pure data module.
