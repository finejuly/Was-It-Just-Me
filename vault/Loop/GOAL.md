# GOAL — Was It Just Me?

_Distilled from [PRD.md](PRD.md) by `loop-goal`. Drives what the loop works on next. Resync after any PRD change._

## North-star

Deliver a polished, self-contained live demo where firing a hotkey instantly drops a privacy-randomized "I noticed something" signal onto a neighborhood map — proving collective noticing while making any single sender's true location impossible to infer.

## Prioritized goals

1. **One-gesture signal send.** Hotkey (desktop) and long-press/tap (touch) emit exactly one signal, from the background, with no classification step.
   _Signal: pressing the hotkey produces one signal end-to-end without opening a form._
2. **Privacy transform at capture.** Jitter + bucketing applied client-side before any storage/transmission; raw GPS/identity never persisted.
   _Signal: property tests confirm stored/displayed coords never equal raw input and are bounded to the bucket._
3. **Map of privacy-randomized dots.** Recent signals render as jittered/bucketed dots; zoom never exceeds bucket precision; recency fades older dots.
   _Signal: dots visible, none at true coordinates, zoom capped at bucket resolution._
4. **Live + historical views.** Rolling live window plus an adjustable time window and a working scrubber over retained history.
   _Signal: scrubbing reproduces the correct earlier signal set at no finer precision than live._
5. **Optional heatmap.** Density layer that matches underlying records and blurs individual contributions.
   _Signal: heatmap density tracks signal counts per cell/window._
6. **First-class demo mode.** Seeded, controllable scenario: nearby signals, scattered false signals, heatmap shifts, hotkey-fired signals, background arrival, historical replay; demo data flagged `source: demo`.
   _Signal: a single command runs the full scripted demo reliably, offline._
7. **Quiet background + no-LLM runtime.** Low-energy background operation; the entire demo builds and runs with no network/LLM dependency.
   _Signal: app runs the demo airplane-mode; no Claude/LLM call at runtime._

## Milestones

1. **M1 — Skeleton:** project scaffold, data model, map renders seeded dots.
2. **M2 — Core signal + privacy:** one-gesture send → jitter+bucket transform → dot on map (privacy tests green).
3. **M3 — Time:** live window, history retention, scrub.
4. **M4 — Heatmap + background/hotkey:** density layer, background operation, global hotkey/long-press.
5. **M5 — Demo mode:** seeded scenario covering all required simulations; stage controls (pause/resume/speed).
6. **M6 — Polish:** demo-facing copy, reliability pass, reassuring "was it just me?" framing.

Prioritize a demo-able MVP: M2 + M5 are the spine of the live demo.

## Out of scope (mirrors PRD non-goals)

- Crime reporting, surveillance, policing, or incident confirmation.
- Classifying what happened (categories/severity/description).
- Any claim about what actually occurred.
- Exact-location display/storage or anything that re-identifies a sender.
- Accounts/identity to send; any LLM/Claude runtime dependency.
- Acting as an emergency service.
