# Loop #21 — Hands-free auto-play demo on load (post-launch "wow")

_2026-06-13 ~17:4x · orchestrator + 5-agent ultracode workflow (investigate → implement →
adversarial verify). Submission already live; user kept driving the loop, so it shipped the
highest-value low-risk demo enhancement for a watch-only judge._

## What & why
A judge opening the live URL previously saw a **static frame** — the demo only animated if they
clicked "▶ Play history". The product's whole emotional payoff is temporal (quiet → signals
arrive → "it wasn't just you"), which was invisible on first sight. Fix: **auto-start the existing,
already-unit-tested playback on load** when Demo mode is on, looping, so the story narrates itself
hands-free. Reuses startPlayback/tickPlayback/advancePlayback — no new motion logic.

## Change (commit `2032b7a`, web only)
- `src/sim/playback.ts` — new pure, DOM-free `shouldAutoPlay(demoOn, prefersReducedMotion)`.
- `src/sim/playback.test.ts` — +3 tests (on→play; off→no; reduced-motion→no). **66 → 69 tests.**
- `src/main.ts` — at boot, `startPlayback()` when `shouldAutoPlay(demoToggle.checked, matchMedia
  prefers-reduced-motion)` is true (guarded with optional chaining for no-matchMedia envs).
- `index.html` — honest play-button `title` tooltip update only.

## Verification (all green)
- npm test **69/69**, typecheck clean, `npm run build` clean, privacy-core bundle **byte-unchanged**.
- 5-agent workflow, **0 blocking findings**: privacy (no new raw-coord path; demo signals still
  transform+source:"demo"; verify-toggle untouched; zoom capped), correctness (wiring correct,
  matchMedia guard safe, manual controls still take over via stopPlayback), demo-readiness (net
  positive, calm/on-brand, no audio, respects reduced-motion).
- **Pushed** to origin/main; deploy verified green; live site serves the new bundle.

## Non-blocking follow-up (parked)
Demo-readiness flagged that the seeded scenario isn't a perfect "quiet→loud" build (the payoff
lands at the final live frame, earlier frames use historical phrasing). The arc still works;
a future tweak could re-time the seed for a stronger crescendo. Not worth the risk now.

## State
Goals M1–M6 met + live + README + hands-free demo. Pending issues 0, reviews 0. Next: triage any
new review/issue; otherwise standby unless the user requests a specific enhancement.
