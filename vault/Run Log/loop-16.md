# Loop 16 — 2026-06-13

## Modules run
- **Orchestrator** (read state, apply config, triage).
- **Triage**: processed **two** reviews this loop —
  - **Review 7** ("don't allow map moving/zoom for now") + the ISSUE-202606131705
    Response ("app is open now, but no dot generated after signaling") → folded into
    one task (TASK-202606131720), since locking the map makes an off-screen sent dot
    unreachable, so the fix had to lock pan/zoom AND keep the sent dot in view.
  - **Review 8** ("~30-40 min to submit; need GitHub, web hosting") → deploy-readiness
    work + a time-critical publish issue.
- **Implementation** (the only code-writing module): two small commits.
- **loop-create-issue**: raised ISSUE-202606131725 (publish + host for submission).
- **loop-progress**: updated Progress.md + this Run Log entry.
- Not run: discovery, plan (both changes were precisely specified from the reviews/response,
  so done-tasks were written directly), independent review (changes verified inline:
  tests + build + unchanged-core SHA), learn, prd/goal (PRD/GOAL unchanged).

## State at start
- Issues: pending **0** · approved 9 (user moved ISSUE-...1705 → approved; its Response was a
  *partial* win — app launches + shows map, but "no dot after signaling") · rejected 2.
- Tasks: candidates 0 · ready 0 · active 0 · done 12.
- Reviews: **2 unprocessed** — Review 7 (map lock) and Review 8 (submission), the latter
  arriving mid-loop. Gate: 0/10 — clear.

## Native launch saga — RESOLVED
ISSUE-202606131705 Response confirms the rebuilt `.app` now **launches and shows the map**
(the Loop #15 `invalid type: map` config fix worked). The remaining complaint was functional
("no dot after signaling"), addressed below. Three native launch-fix round-trips are now done.

## What changed
- **Code — commit "lock map pan/zoom (Review 7) + recenter on each sent signal"**:
  - `src/ui/mapView.ts`: `L.map` options now disable `dragging`, `scrollWheelZoom`,
    `doubleClickZoom`, `boxZoom`, `keyboard`, `touchZoom` and set `zoomControl: false`
    → a fixed, non-interactive frame. `setView`/`recenter` still work programmatically.
  - `src/main.ts`: `sendSignal()` calls `mapView.recenter(record.jittered_lat,
    record.jittered_lng)` after `store.add` so each sent dot is centered in the locked
    view (fixes "no dot after signaling" = dot landed off-screen). Uses the already
    privacy-safe jittered point; no raw coordinate.
- **Code — commit "make web app deploy-ready for submission (Review 8)"**:
  - `vite.config.ts`: `base: "./"` → relative asset URLs; the static build hosts at a
    domain root OR a GitHub Pages project subpath (default "/" would 404 under a subpath).
  - `.github/workflows/deploy.yml` (new): GitHub Actions builds + tests + publishes `dist/`
    to GitHub Pages on push to `main`.
- **Verification (headless, inline)**:
  - `npm run build` (tsc + vite): clean; `dist/index.html` references `./assets/...`.
  - Web tests **66/66**.
  - `build:core` privacy-core bundle SHA **byte-for-byte unchanged**
    (`103c823f12fb9270bfde9d805ba96942908b8928bc715300562ee9864c239430`) — no privacy
    path touched by either commit.
- **Vault**:
  - `Tasks/done/TASK-202606131720-lock-map-and-center-on-send.md` (new, done).
  - `Reviews/processed/Review 7.md` + `Reviews/processed/Review 8.md` (triaged, annotated).
  - `Issues/pending/ISSUE-202606131725-publish-and-host-for-submission.md` (new).
  - `Progress.md` updated.

## Issue gate
**Not triggered.** Pending after this loop = **1** (ISSUE-...1725) ≤ limit 10.
Implementation was permitted and ran.

## New pending issues needing user attention
- **ISSUE-202606131725** — TIME-CRITICAL. Create the GitHub repo + push + enable Pages via
  the prepared copy-paste `gh` block (option 1) → live at
  https://finejuly.github.io/was-it-just-me/ in ~1-2 min. `gh` is already authenticated as
  `finejuly`. The loop did NOT push (publishing public code is the user's irreversible call).

## Next iteration
- If ISSUE-...1725 is approved/done → submission shipped; if the live URL 404s / assets fail,
  debug the deploy (base-path / Pages source). Else resume M6 web polish. Triage any new
  review first.
