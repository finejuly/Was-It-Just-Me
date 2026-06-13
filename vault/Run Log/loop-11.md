# Loop #11 — 2026-06-13

- **Entry state**: ISSUE-...1317 (Tauri sub-decisions) had been **moved to `Issues/approved/`** by
  the user (start-of-loop `git status` showed it deleted from pending/, new copy untracked in
  approved/). TASK-...1316 (Tauri shell) was a candidate. Pending issues 0. Web app green (61/61).
  Config: refresh_minutes=1, unanswered_issue_limit=10. **Verified actual vault state, not the
  loop-#10 summary.**
- **Config applied**: issue gate clear (0/10) → implementation permitted.
- **Modules run**: Review-triage (none) · Planning · Implementation · Issue-create · Progress/Run-Log.
  No discovery/PRD/goal/learn needed (the Tauri pivot's learnings were already recorded loop #10;
  PRD/GOAL unchanged — Tauri is an implementation vehicle for the same web app + M4 hotkey/background).

- **User decisions read (approved ISSUE-...1317 "# Response")**: 1) Rust = "I don't know";
  2) bridge = (a) **Tauri event** → frontend `sendSignal()`; 3) shortcut `Cmd+Shift+Space` = "Agree";
  4) close = "keep running" → **hide-to-tray**; 5) packaging = **macOS only**.

- **Toolchain probe (decisive)**: `rustc`/`cargo`/`rustup` **NOT installed** (no `~/.cargo`); Node 24 /
  npm 11 present. Per the issue's own protocol the loop did **not** install system tools — it authored
  everything cargo-free and gated the build on a user Rust install.

- **Planning**: promoted **TASK-...1316** candidate → ready → active with a plan that explicitly
  splits **Part A (cargo-free authoring — do now)** from **Part B (`tauri dev`/`build` — gated on Rust)**.

- **Implementation (committed `6cc328f`, product code only, no push)** — Part A:
  - `src-tauri/` **Tauri v2** project authored by hand (no cargo run): `Cargo.toml` (tauri v2 +
    `tray-icon`, `tauri-plugin-global-shortcut` v2, serde), `tauri.conf.json` (`frontendDist=../dist`,
    `devUrl=:5173`, beforeDev/Build cmds, `bundle.targets=["app","dmg"]` macOS, identifier
    `ai.cochlear.wasitjustme`), `src/lib.rs` + `src/main.rs`, `build.rs`, `capabilities/default.json`
    (core + global-shortcut perms; **no fs/location perms**), `.gitignore`, `README.md`.
  - `lib.rs`: tray menu (notice/show/quit); global shortcut **SUPER|SHIFT+Space**; **hide-to-tray**
    (`CloseRequested` → `prevent_close()` + `hide()`); Quit = `app.exit(0)`. Tray-notice AND shortcut
    both `emit("wijm://notice")`. **No latitude/longitude/jitter/bucket logic** (grep confirms only
    explanatory comments) — all privacy stays in the web `transformSignal`/`SignalStore`.
  - `src/main.ts`: added a **Tauri-guarded** listener (`"__TAURI_INTERNALS__" in window`) that
    **dynamically** `import("@tauri-apps/api/event")` and on `wijm://notice` calls the **unchanged**
    `sendSignal()`. Vite code-split the Tauri API into its own 1.23 kB lazy chunk → the plain browser
    bundle never loads it; in-page Space hotkey + Notice button untouched. No privacy code added.
  - `package.json`: `@tauri-apps/cli@2.11.2` (devDep) + `@tauri-apps/api@2.11.0` (dep) +
    `tauri`/`tauri:dev`/`tauri:build` scripts. `npm install` added 4 packages.
  - **Verified (orchestrator)**: `npm run typecheck` clean · `npm test` **61/61** · `npm run build` ok
    (lazy event chunk emitted) · `build:core` bundle **byte-for-byte unchanged** (empty `git diff --stat`).
  - TASK-...1316 → **done** for the authoring scope (Part A criteria all checked; Part B left unchecked,
    explicitly blocked-on-Rust).

- **Issue raised**: **ISSUE-...1318** (pending) — install Rust (one-line `curl ... | sh` rustup) so the
  next loop can `npm run tauri:dev`/`tauri:build`, verify tray + global hotkey + close-to-tray, and
  build the macOS bundle (closes Part B of TASK-...1316). Notes the missing-icon build step too.

- **Issue gate**: pending now **1/10** — clear. Implementation was not gated.

- **Stop reason**: the entire Tauri scaffold that doesn't need Rust is authored, committed, and verified
  (web app still 61/61, browser path untouched). The only remaining work (`tauri dev`/`build`) genuinely
  requires the user to install Rust — surfaced as ISSUE-...1318 rather than guessing or modifying system
  tools. No push, no PR; `vault/.obsidian/workspace.json` left out of the commit (UI-churn convention).
