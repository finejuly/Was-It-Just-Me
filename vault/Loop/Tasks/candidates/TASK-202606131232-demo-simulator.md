---
id: 202606131232
title: Demo-mode signal simulator (seeded, controllable scenario)
status: candidate
priority: high
source: discovery
created: 2026-06-13
---

## Summary
Build the seeded demo-mode simulator that drives the live demo (GOAL #6, milestone M5 — half the demo spine). Core logic is platform-independent and consumes the signal-core module (TASK-202606131231).

## Scope / notes
Per [PRD.md](../../PRD.md) (Simulation mode), simulate: signals appearing nearby over time, scattered false/background signals, heatmap density changes, hotkey-triggered signals (operator fires live), background arrival, and historical replay over a pre-seeded timeline. Must be **seedable/deterministic** with pause/resume/speed controls. All generated signals flagged `source: demo` and isolatable from real signals. Runs fully offline (no network/LLM).

## Acceptance criteria
- [ ] To be refined by `loop-plan` — must cover each required simulation from the PRD and prove demo data is flagged `source: demo` and separable.
