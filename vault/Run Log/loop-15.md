# Loop 15 — 2026-06-13

## Modules run
- **Orchestrator** (read state, apply config, triage).
- **Triage**: a fresh native crash arrived in the **Response of ISSUE-202606131620**
  (which the user had moved to `approved/`), not as a Review file. Treated as a fresh
  crash report and triaged FIRST (it outranks planned polish).
- **Implementation** (TASK-202606131700): the only code-writing module this loop.
- **loop-create-issue**: raised the post-fix GUI re-verify (ISSUE-202606131705).
- **loop-progress**: updated Progress.md + this Run Log entry.
- Not run: discovery, plan (the fix was precisely diagnosable from the error text, so a
  done-task was written directly), review (no `done` work needs independent review beyond
  the headless verification performed inline), learn, prd/goal (PRD/GOAL unchanged).

## State at start
- Issues: pending **0** · approved 8 (user had moved ISSUE-...1620 → approved, but its
  Response said "Still nothing" + a NEW error) · rejected 2.
- Tasks: candidates 0 · ready 0 · active 0 · done 11.
- Reviews: 0 pending (6 processed; no Review 7). Gate: 0/10 — clear.

## The defect (from the ISSUE-...1620 Response)
Running the rebuilt binary directly:
```
[wijm] desktop shell exited with error: failed to initialize plugin `global-shortcut`:
Error deserializing 'plugins.global-shortcut' within your Tauri configuration:
invalid type: map, expected unit
```
A *different* failure from the Review-6 SIGABRT, and it aborts during **config parse** —
before Loop #14's "show the window on launch" fix could run, which is why the screen still
showed nothing.

## Root cause
`src-tauri/tauri.conf.json` declared `plugins: { "global-shortcut": {} }`. The
`tauri-plugin-global-shortcut` v2 plugin takes **no** JSON config (its config type is a
*unit*); an empty object `{}` deserializes as a **map**, so Tauri rejected the config and
`builder.run(...)` returned `Err` before any window was shown. The plugin is registered and
configured entirely at runtime in `lib.rs`
(`.plugin(tauri_plugin_global_shortcut::Builder::new().build())` + `register_global_shortcut`),
so the config block was both invalid AND unnecessary.

## What changed
- **Code (commit `7ab5dfa`)**: removed the `plugins` block from
  `src-tauri/tauri.conf.json` (its only key was the offending `global-shortcut: {}`).
  Config-only; no privacy/location code touched. `capabilities/default.json` (which holds
  the `global-shortcut:default` *permission*) left unchanged.
- **Verification (headless, inline)**:
  - JSON parses; `plugins` key now absent (node `JSON.parse`).
  - `cargo check` clean — **0 warnings**.
  - Web test suite **66/66 pass**.
  - `build:core` privacy-core bundle SHA **byte-for-byte unchanged**
    (`103c823f12fb9270bfde9d805ba96942908b8928bc715300562ee9864c239430`).
- **Vault**:
  - `Tasks/done/TASK-202606131700-fix-global-shortcut-config.md` (new, done).
  - `Issues/pending/ISSUE-202606131705-native-launch-reverify-after-config-fix.md` (new;
    supersedes ISSUE-...1620 for the GUI re-verify the human still owes).
  - `Progress.md` updated.

## Issue gate
**Not triggered.** Pending after this loop = **1** (ISSUE-...1705) ≤ limit 10.
Implementation was permitted and ran.

## New pending issues needing user attention
- **ISSUE-202606131705** — rebuild + launch the `.app`, confirm the `invalid type: map`
  error is gone and the map window appears (menu-bar icon, Cmd+Shift+Space fires one
  signal, close hides to menu bar, Quit exits). Approve if green; else paste the exact
  console line / drop `Reviews/Review 7.md`.

## Next iteration
- If ISSUE-...1705 is approved → native shell is finally demo-ready; pivot to **M6
  web-demo polish** on the reliable web spine (privacy callout / first-run narration /
  livelier seeded scenario). If a new native error/review lands → triage first.
