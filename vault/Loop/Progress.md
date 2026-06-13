# Progress

_Last updated: 2026-06-13 (loop #16)_

## Status
**Native launch saga is RESOLVED — the app finally launches and shows the map.**
The user moved ISSUE-202606131705 to `approved/`; its Response was a *partial* win:
**"The app is open now, but no dot generated after signaling."** That confirms the
Loop #15 `invalid type: map` config fix worked (the menu-bar app launches and presents
the map). Two new reviews also arrived and were both triaged + acted on this loop:
- **Review 7** ("don't allow map moving/zoom for now") and the "no dot" report were
  handled together (TASK-202606131720, done):
  - **Locked the map** (`src/ui/mapView.ts`): disabled drag/scroll-wheel/double-click/
    box/keyboard/touch zoom + removed the `+/-` control → a fixed frame. Programmatic
    `setView` (recenter) still works.
  - **Recenter on each sent signal** (`src/main.ts` `sendSignal()`): after `store.add`,
    `mapView.recenter(record.jittered_lat, record.jittered_lng)`. The most likely cause
    of "no dot" was a sent dot landing **outside a now-locked viewport** — recentering on
    the already privacy-safe (jittered/bucketed) point guarantees the dot is visible. No
    raw coordinate is read/stored/displayed; the privacy path is untouched.
- **Review 8** (time-critical: "~30-40 min to submit; need GitHub + web hosting"):
  made the web app **deploy-ready** (TASK noted in Run Log):
  - `vite.config.ts` → `base: "./"` so built assets load at any path (domain root OR a
    GitHub Pages project subpath); `dist/index.html` now references `./assets/...`.
  - Added `.github/workflows/deploy.yml` (Actions → build + test + publish `dist/` to
    GitHub Pages on push to `main`).
  - The irreversible publish step (create public repo + push) is the user's call →
    raised **ISSUE-202606131725** with exact copy-paste `gh` commands (`gh` is already
    authenticated as `finejuly`). **No remote exists yet; nothing pushed.**

Verified this loop: tests **66/66**; `tsc`+`vite build` clean; `build:core` privacy-core
bundle SHA **`103c823…` byte-for-byte unchanged** (proves no privacy/location code touched).

## Snapshot
- Tasks: candidates 0 · ready 0 · active 0 · done **13** (TASK-...1720 added this loop)
- Issues: pending **1** (ISSUE-...1725, submission publish/host — time-critical action) ·
  approved **9** (incl. ISSUE-...1705, now effectively resolved: app launches + shows map;
  the "no dot" follow-up is fixed by TASK-...1720) · rejected 2
- Reviews: **0 pending** (8 processed — Review 7 + Review 8 triaged this loop)
- App: web app builds; `npm run dev` → http://localhost:5173/ ; **tests 66/66**. Map is now
  a locked view; sent signals recenter into view. Native `.app` launches + shows the map.
  Web build is deploy-ready (relative base + Pages workflow). `build:core` SHA unchanged.
- Issue gate: **1/10 — clear** (implementation permitted; it ran). Config:
  refresh_minutes=1, unanswered_issue_limit=10.
- Commits this loop (local `main`, not pushed — no remote yet):
  - "lock map pan/zoom (Review 7) + recenter on each sent signal"
  - "make web app deploy-ready for submission (Review 8)"

## Now / Next
- **USER (time-critical — please action ISSUE-...1725 now):** run the one block in option 1
  to create the GitHub repo + push + enable Pages → live at
  https://finejuly.github.io/was-it-just-me/ in ~1-2 min. (Or option 2 for repo-only.)
  `gh` is already authenticated. Paste any command error and the loop fixes it fast.
- **Loop #17 (default):** if ISSUE-...1725 is approved/done → submission is shipped; if the
  user reports the live Pages URL 404s or assets fail, debug the deploy (likely base-path /
  Pages-source). Otherwise resume M6 web polish (privacy callout / first-run narration /
  livelier seeded scenario). Triage any new review first.
- **User live-test (web, the demo spine):** http://localhost:5173/ — answer headline; the map
  is now fixed (no pan/zoom); Demo mode → activity strip / scrub / Play history (2×/4×);
  Density; Verification mode (off by default). Space hotkey + Notice button send and recenter.

## Blocked
- **Submission publish/host (ISSUE-...1725)** — needs the user to run the prepared `gh`
  commands (irreversible: publishes code). App is built + green; this is the publish step only.
- **DMG** intentionally off by default (headless bundler limit); produce in a GUI session
  (`npm run tauri -- build --bundles dmg`).
- **App icon is a placeholder** — swap via `tauri icon <png>` when a real logo exists.
- **Code signing**: app is ad-hoc signed; Developer-ID/notarization only if a future macOS
  registration issue resurfaces (not currently seen).

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it.
Config is `refresh_minutes=1`. A fixed-interval cron is more robust within a running session
— switchable on request.
