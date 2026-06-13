# Progress

_Last updated: 2026-06-13 (loop #15)_

## Status
**Native launch crash #2 root-caused and fixed (config-only).** The user moved
ISSUE-202606131620 to `approved/` but their **Response reported a NEW failure**:
running the rebuilt binary printed
`failed to initialize plugin global-shortcut: ... invalid type: map, expected unit`
— a *different* error from the Review-6 SIGABRT, and it aborts **before** Loop #14's
"show the window on launch" fix can run. Treated as a fresh crash report (it outranks
planned polish). This loop:

- **Native launch-crash fix (TASK-202606131700 → done, commit `7ab5dfa`):** removed
  the `plugins.global-shortcut: {}` block from `src-tauri/tauri.conf.json`. The
  `tauri-plugin-global-shortcut` v2 plugin takes **no** JSON config (config type =
  *unit*); the empty `{}` deserialized as a **map**, so Tauri rejected the config at
  startup and `builder.run()` returned `Err` before any window showed. The plugin is
  registered + configured entirely at runtime in `lib.rs`, so the config block was
  both invalid and unnecessary. **No privacy/location code touched** (config-only).
  Verified: `cargo check` clean (0 warnings); JSON parses with no `plugins` key; web
  tests **66/66**; `build:core` privacy-core bundle SHA **byte-for-byte unchanged**.

## Snapshot
- Tasks: candidates 0 · ready 0 · active 0 · done **12** (TASK-...1700 added this loop)
- Issues: pending **1** (ISSUE-...1705, 3rd native launch re-verify after the config
  fix) · approved **8** (ISSUE-...1620 was moved here by the user; its Response carried
  the new error, now triaged into TASK-...1700) · rejected 2
- Reviews: 0 pending (6 processed; no new review this loop — the new defect arrived in
  the ISSUE-...1620 Response rather than as Review 7, and was triaged the same way)
- App: web app builds; `npm run dev` → http://localhost:5173/ ; **tests 66/66**. Native
  macOS `.app` config fix is `cargo check`-clean; needs a GUI rebuild+smoke-test
  (ISSUE-...1705). `build:core` reference bundle **byte-for-byte unchanged** (same SHA).
- Issue gate: **1/10 — clear** (implementation permitted this loop). Config:
  refresh_minutes=1, unanswered_issue_limit=10.

## Now / Next
- **USER (one quick re-verify — please action ISSUE-...1705)**: rebuild
  (`npm run tauri:build`) then launch the `.app` and confirm the **`invalid type: map`
  error is gone and the map window appears on launch** (menu-bar icon; Cmd+Shift+Space
  fires one signal; close hides to menu bar; tray Quit exits). Approve if green; if a
  new/different error appears, paste the exact console line (or drop `Reviews/Review 7.md`).
- **Loop #16 (default)**: if ISSUE-...1705 is approved → native shell is finally
  demo-ready; pivot to **M6 web-demo polish** on the web spine (e.g. a brief on-screen
  "how this protects you" privacy callout, first-run demo narration, or a denser/livelier
  seeded scenario for the activity strip). If a new native error/review lands → triage
  first. If the user provides a signing identity or real logo, wire those in.
- **User live-test (web app, the demo spine — always reliable)**: http://localhost:5173/
  — answer headline at the top of the map; toggle Demo mode → activity strip / scrub /
  Play history (2×/4×) → headline reframes live↔history; Density; Verification mode
  (off by default). Space hotkey + Notice button unchanged.

## Blocked
- **Native `.app` launch re-verification (ISSUE-...1705)** — the config fix is `cargo
  check`-clean but "does it now launch and show the window?" is a **human GUI smoke-test**
  (headless can't run a GUI app). Not a build blocker; the web demo is unaffected.
- **DMG** intentionally off by default (headless bundler limitation); produce on demand in
  a GUI session (`npm run tauri -- build --bundles dmg`).
- **App icon is a placeholder** — swap via `tauri icon <png>` when a real logo exists.
- **Code signing**: app is ad-hoc signed. A Developer-ID/notarized build remains the
  robust path only if a future macOS-26 registration issue resurfaces (not currently seen).

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it.
Config is `refresh_minutes=1`. A fixed-interval cron is more robust within a running
session — switchable on request.
