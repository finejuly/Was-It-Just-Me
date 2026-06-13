---
id: 202606131700
title: Fix native .app launch crash — remove invalid plugins.global-shortcut config block
status: done            # candidates → ready → active → done
type: bug
created: 2026-06-13
loop: 15
source: ISSUE-202606131620 user Response ("Still nothing" + new error)
milestone: M5/M6 (native shell flourish; web spine unaffected)
privacy_impact: none (config-only; no location/privacy code touched)
---

## Problem (fresh crash, reported in ISSUE-202606131620 Response)
Running the rebuilt `.app` binary directly surfaced a NEW, different launch error
(no longer the SIGABRT; the Loop #14 visibility fix was never reached because the
app aborts during config parse):

```
[wijm] desktop shell exited with error: failed to initialize plugin `global-shortcut`:
Error deserializing 'plugins.global-shortcut' within your Tauri configuration:
invalid type: map, expected unit
```

## Root cause
`src-tauri/tauri.conf.json` declared:

```json
"plugins": {
  "global-shortcut": {}
}
```

The `tauri-plugin-global-shortcut` v2 plugin takes **no** JSON config — its config
type is a *unit*. An empty object `{}` deserializes as a **map**, so Tauri's config
parser rejects it at startup with `invalid type: map, expected unit`, and
`builder.run(...)` returns an `Err` before the window is ever shown. The plugin is
in fact configured entirely at runtime in `lib.rs`
(`.plugin(tauri_plugin_global_shortcut::Builder::new().build())` + `register_global_shortcut`),
so the config block was both wrong AND unnecessary.

## Fix
Remove the `plugins` block from `tauri.conf.json` (it contained only the offending
`global-shortcut: {}`). The plugin stays registered in Rust; the
`global-shortcut:default` permission stays in `capabilities/default.json` (unchanged).

## Acceptance criteria
- [x] `tauri.conf.json` no longer contains a `plugins.global-shortcut` (map) entry.
- [x] `cargo check` clean (0 warnings) — config still valid Rust-side.
- [x] Config JSON parses and `plugins` key is absent (verified by node JSON.parse).
- [x] Web test suite still green (no web/privacy regression): 66/66.
- [x] `build:core` reference bundle SHA unchanged (privacy core untouched).
- [ ] HUMAN GUI smoke-test: launch the rebuilt `.app`, confirm the map window now
      appears (no `invalid type: map` error). Tracked by new re-verify issue.

## Notes
No privacy or location code touched. The web app (the reliable demo spine) is
entirely unaffected by this change.
