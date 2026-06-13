---
id: 202606131231
title: Signal data model + privacy transform (jitter + bucketing) as a pure, tested module
status: candidate
priority: high
source: discovery
created: 2026-06-13
---

## Summary
Build the platform-independent core: the signal data model and the client-side privacy transform that turns a raw capture location into a privacy-safe record. This is the spine of GOAL #2 (privacy at capture) and #1's payload, and it is buildable before the platform decision lands.

## Scope / notes
- Implement the data model from [PRD.md](../../PRD.md) (Data model): `id`, `cell`, `jittered_lat`, `jittered_lng`, `t`, `source`. **No** raw GPS, identity, category, description, or exact timestamp.
- Privacy transform: per-signal randomized **jitter** within a bounded radius + **bucketing** to a coarse grid/geohash cell; coarsen timestamp; sparse-area suppression threshold.
- Pure module (no UI, no platform APIs) so it's reusable across whatever platform Issue 202606131230 selects.

## Acceptance criteria
- [ ] To be refined by `loop-plan` — but must include privacy property tests: stored/displayed coords never equal raw input, jitter is randomized per signal and bounded, bucketing snaps to configured resolution, no raw-GPS/identity fields ever present. (PRD "Testing requirements" — highest priority.)
