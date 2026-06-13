---
id: 202606131231
title: Signal data model + privacy transform (jitter + bucketing) as a pure, tested module
status: done
priority: high
source: discovery
created: 2026-06-13
planned: 2026-06-13
completed: 2026-06-13
language_runtime: TypeScript (web app per ISSUE-202606131230); core runs anywhere, tested via node:test
---

## Summary
The platform-independent privacy spine of the product (GOAL #1/#2). A pure module that converts a raw capture `(lat, lng, timestamp)` into a privacy-safe signal record that can never be reversed to the sender's true location, plus the aggregation/display rules. No UI, no network, no platform/location APIs, no LLM.

## Design (language-agnostic)
Pipeline `transformSignal(rawLat, rawLng, tsMillis, source, rng) -> SignalRecord`:
1. **Bucketing** — snap `(rawLat,rawLng)` to a coarse cell. Use geohash at `BUCKET_PRECISION` (default length 6 ≈ ~1.2km×0.6km; tune for "many plausible origins per cell"). `cell = geohash(rawLat, rawLng, BUCKET_PRECISION)`.
2. **Jitter** — display coords = a **uniform-random point within the cell's bounds** using injected `rng` (NOT center + Gaussian — that would leak the center; NOT a fixed offset — that could be subtracted out). Drawn independently per signal so repeated signals from one true location scatter across the whole cell rather than clustering.
3. **Timestamp coarsening** — `t = floor(tsMillis / WINDOW_MS) * WINDOW_MS` (default `WINDOW_MS = 60_000`). Sub-window precision is discarded.
4. **Opaque id** — random, unlinkable id; not derived from location or time.
5. **Output** — `{ id, cell, jittered_lat, jittered_lng, t, source }` and **nothing else**. Raw lat/lng, identity/device id, and exact timestamp are never stored or returned.

Display/aggregation `visibleCells(records, window) -> cells[]`:
- **Sparse-area suppression (k-anonymity)**: a cell is only shown/aggregated once it holds `>= K_ANON` records in the window (default `K_ANON = 3`; demo mode may lower it). Prevents isolating a lone sender.

Config constants: `BUCKET_PRECISION`, `WINDOW_MS`, `K_ANON`. `rng` is injectable (deterministic seed in tests; CSPRNG in production).

## Acceptance criteria
- [ ] `transformSignal(...)` returns an object with **exactly** the PRD fields (`id, cell, jittered_lat, jittered_lng, t, source`) and no raw-input/identity fields.
- [ ] `record.cell === geohash(rawLat, rawLng, BUCKET_PRECISION)`.
- [ ] `jittered_lat/_lng` always decode back to the same `cell` at `BUCKET_PRECISION` (within-cell invariant → zoom can never exceed bucket precision).
- [ ] Property test over many random inputs: `jittered_*` never exactly equals raw input.
- [ ] Per-signal randomization: identical raw input with independent rng draws yields different jittered coords (statistical check over N draws).
- [ ] `t` is a multiple of `WINDOW_MS`; finer precision not recoverable.
- [ ] `visibleCells` excludes any cell with `< K_ANON` records in the window.
- [ ] `rng` is injectable (deterministic tests pass); default path uses a CSPRNG.
- [ ] Module is pure/standalone: no UI/network/platform/LLM imports.

## Test notes
Property/unit tests per criterion above; this is the PRD's highest-priority test area. Use a seeded rng so privacy invariants are checked deterministically. Add a fuzz pass over random coordinates spanning antimeridian/poles edge cases.

## Risks / privacy considerations
- Geohash cells are rectangular (aspect ratio leak) — acceptable; ensure jitter is uniform **within** the cell, never center-biased.
- Triangulation across repeated signals is mitigated by uniform-within-cell + independent per-signal rng; document this invariant in the module.
- Concrete language/test framework awaits ISSUE-202606131230; the design and test spec above are language-independent and ready to implement once the stack is chosen.

## Result — done 2026-06-13 (loop #3)
Implemented in TypeScript as a pure, dependency-free module (web-app stack approved in ISSUE-202606131230):
- [src/core/geohash.ts](../../../../src/core/geohash.ts) — minimal geohash encode + cell-bounds decode (no deps).
- [src/core/privacy.ts](../../../../src/core/privacy.ts) — `transformSignal`, `visibleCells`, `SignalRecord`, config, injectable CSPRNG; privacy invariants documented in the file header.
- [src/core/privacy.test.ts](../../../../src/core/privacy.test.ts) — 11 tests via `node:test`.

**Verification: `npm test` → 11/11 pass.** All acceptance criteria covered:
- exactly the PRD fields, no raw/identity leakage ✓
- `cell === geohash(raw, precision)` ✓ · within-cell invariant (500 random inputs) ✓
- jitter never equals raw (500 inputs) ✓ · per-signal randomization ✓
- timestamp coarsened to window ✓ · injectable deterministic rng ✓ · unique opaque id ✓
- k-anonymity suppression ✓ · `source` flag preserved ✓

No external dependencies installed (runs offline; no network/LLM). Consumable directly by the upcoming web/map UI (TASK-202606131233).
