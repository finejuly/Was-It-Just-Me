# Progress

_Last updated: 2026-06-13 (loop #11)_

## Status
The user **approved the Tauri sub-decisions (ISSUE-...1317)**, so loop #11 **scaffolded the Tauri
v2 desktop shell** (TASK-...1316) that wraps the existing web app verbatim — one privacy core, no
UI fork, no JSC bridge. All of the scaffold that does **not** need the Rust toolchain is authored,
committed, and verified; the actual `tauri dev`/`build` is the only remaining step and is **gated
on the user installing Rust** (the machine has no `rustc`/`cargo`/`rustup`), raised as ISSUE-...1318.

- **Tauri shell scaffold shipped (committed `6cc328f`):** `src-tauri/` Tauri **v2** project
  (`Cargo.toml`, `tauri.conf.json` → `frontendDist=../dist`, `devUrl=:5173`, macOS `app`/`dmg`
  bundle; `src/lib.rs`+`src/main.rs`, `build.rs`, `capabilities/default.json`, `.gitignore`,
  `README.md`). Tray menu (*I noticed something* / *Show map* / *Quit*), OS-global shortcut
  **Cmd/Ctrl+Shift+Space**, **hide-to-tray on close** (Quit exits) — exactly the approved
  ISSUE-...1317 decisions. The native layer has **no location/privacy logic**: tray-notice and the
  shortcut both `emit("wijm://notice")`; the frontend (Tauri-guarded + dynamically imported, so the
  browser bundle is unaffected) calls the **unchanged** `sendSignal()` → `transformSignal`/`SignalStore`,
  byte-for-byte the in-page Space-hotkey path. npm: `@tauri-apps/cli@2.11.2` + `@tauri-apps/api@2.11.0`
  + `tauri*` scripts. **Web app stays green: tests 61/61, typecheck clean, build ok, `build:core`
  bundle byte-for-byte unchanged.** TASK-...1316 → done (authoring scope).
- **Rust gate surfaced:** ISSUE-...1318 (pending) gives the user the one-line rustup install + the
  `npm run tauri:dev` next step; until then the web app is the full live demo and the Tauri code sits
  in-tree ready to build.

## Snapshot
- Tasks: candidates 0 · ready 0 · active 0 · done 9 (+TASK-...1316 Tauri shell, authoring scope)
- Issues: **pending 1 (ISSUE-...1318 Rust install)** · approved 5 (+...1317 answered) · rejected 2
- Reviews: 0 pending (5 processed)
- App: web app builds; `npm run dev` → http://localhost:5173/ ; **tests 61/61**. Tauri shell authored
  but **not yet built** (needs Rust). `npm run build:core` reference bundle unchanged.
- Issue gate: **1/10 — clear**. Config: refresh_minutes=1, unanswered_issue_limit=10.

## Now / Next
- **User (action needed)**: **ISSUE-...1318** — install Rust (`curl --proto '=https' --tlsv1.2 -sSf
  https://sh.rustup.rs | sh`, restart shell), then move the issue to `approved/` with a note. That
  unblocks the native demo. If you'd rather not install Rust now, move it to `rejected/` — the web app
  remains the complete live demo and the Tauri code waits in-tree.
- **Loop #12 (if ISSUE-...1318 approved)**: run `npm run tauri:dev` — verify the web UI loads in a
  native window, the tray + `Cmd+Shift+Space` each fire exactly one signal while backgrounded, close
  hides to tray, Quit exits; generate icons (`npm run tauri -- icon <png>`) and `npm run tauri:build`
  the macOS bundle. Closes Part B of TASK-...1316.
- **Loop #12 (if ISSUE-...1318 still pending/rejected)**: continue web-demo polish on the spine
  (GOAL #6 / M6 — demo-facing copy, reliability/UX), since the web app is the working demo Tauri wraps.
- **User live-test (web app, the demo spine)**: http://localhost:5173/ — Demo mode → activity strip
  under the scrubber; click a bar or drag to scrub; Play history (2×/4×); Back to live; Density;
  Verification mode (off by default). The browser Space hotkey + Notice button are unchanged.

## Blocked
- **TASK-...1316 Part B (`tauri dev`/`tauri build`, native demo)** — gated on **ISSUE-...1318** (user
  installs Rust/cargo). Part A (all cargo-free authoring) is done and committed.
- **Bundle icons** — `tauri.conf.json` references `icons/*` but none are committed; generate with
  `tauri icon` after Rust is installed (a logo asset from the user would help; noted in ISSUE-...1318).

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it. Config is
`refresh_minutes=1`. A fixed-interval cron is more robust within a running session — switchable on request.
