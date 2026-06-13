# Progress

_Last updated: 2026-06-13 (loop #14)_

## Status
**Native launch fixed (window now shown) + web demo got its emotional payoff.**
The user **approved ISSUE-202606131516** (the rebuilt `.app` no longer crashes — Loop
#13's panic-free + accessory-app fix worked) but their Response flagged a real defect:
*"No crash, but nothing was opened."* Root cause: a menu-bar **accessory** app gets no
Dock presence and macOS does **not** auto-front its window on launch, so `visible: true`
alone left the map window behind/unfocused and the app looked like a no-op. This loop:

- **Native launch-visibility fix (TASK-202606131614 → done):** in
  `src-tauri/src/lib.rs` `setup`, after wiring the tray, the app now **explicitly
  surfaces the map window** via the same path the tray "Show map" uses —
  `win.unminimize(); win.show(); win.set_focus();`, all infallible (`let _ = …`) so it
  cannot reintroduce the Review-6 startup abort. Activation policy stays `Accessory`
  (menu bar, not Dock — flipping to `Regular` was rejected: it re-enters the crash path).
  `cargo check` **clean (0 warnings)**.
- **M6 web-demo polish — the "answer" headline (web spine):** a calm teal overlay at the
  top of the map now **directly answers the product's question** from the privacy-safe
  aggregate count in view — 0 → "Quiet here right now…", 1 → "it might just be you…",
  2+ → "It wasn’t just you — N nearby noticed something too." It updates live as signals
  arrive and as the operator scrubs history (the demo's emotional payoff). Logic lives in
  a new pure `src/ui/answer.ts` (sees ONLY an aggregate count — no coords, no per-sender
  data) with 5 dedicated tests, incl. a guard that the copy never leaks coordinate-like
  tokens. New markup `#answer` + `.answer` styles; `main.ts` renders it in `refresh()`.

## Snapshot
- Tasks: candidates 0 · ready 0 · active 0 · done **11** (TASK-...1614 added this loop)
- Issues: pending **1** (ISSUE-...1620, native launch-window re-verify) · approved **7**
  (ISSUE-...1516 moved here by the user) · rejected 2
- Reviews: 0 pending (6 processed; no new review this loop)
- App: web app builds; `npm run dev` → http://localhost:5173/ ; **tests 66/66** (+5 for
  the answer headline). Native macOS `.app` change is `cargo check`-clean; needs a
  GUI rebuild+smoke-test (ISSUE-...1620). `build:core` reference bundle **byte-for-byte
  unchanged** (same SHA); `vite build` green.
- Issue gate: **1/10 — clear** (implementation still permitted). Config:
  refresh_minutes=1, unanswered_issue_limit=10.

## Now / Next
- **USER (one quick re-verify — please action ISSUE-...1620)**: rebuild
  (`npm run tauri:build`) then `open "…/Was It Just Me.app"` and confirm the **map
  window now appears on launch** (menu-bar icon, Cmd+Shift+Space fires one signal, close
  hides to menu bar, tray Quit exits). Approve if green; if it still shows nothing, drop
  `Reviews/Review 7.md` with what you see (the loop will dig into window geometry/console).
- **Loop #15 (default)**: if ISSUE-...1620 is approved → native shell is demo-ready;
  continue **M6 web-demo polish** on the web spine (e.g. a brief on-screen "how this
  protects you" privacy callout, first-run demo narration, or a denser/livelier seeded
  scenario for the activity strip). If a new crash/visibility review lands → triage first.
  If the user provides a signing identity or a real logo, wire those in.
- **User live-test (web app, the demo spine — always reliable)**: http://localhost:5173/
  — note the new **answer headline** at the top of the map; toggle Demo mode → activity
  strip / scrub / Play history (2×/4×) → watch the headline reframe live↔history /
  Density / Verification mode (off by default). Space hotkey + Notice button unchanged.

## Blocked
- **Native `.app` launch re-verification (ISSUE-...1620)** — the fix is `cargo
  check`-clean but "does the window now appear on launch?" is a **human GUI smoke-test**
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
</content>
