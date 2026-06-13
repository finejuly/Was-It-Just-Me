# Progress

_Last updated: 2026-06-13 (loop #10)_

## Status
The user **answered the toolchain blocker (ISSUE-...1314) with a product-direction pivot: "Let's move to Tauri then."** — replacing the Swift/JSC native menu-bar route with a **Tauri** desktop shell that wraps the **existing web app verbatim** (one privacy core, no JSC bridge, no broken Swift toolchain). Loop #10 therefore (a) shipped a focused **web-app polish** that improves the live demo regardless of the native route, and (b) re-pointed the native track to Tauri (closed the Swift tasks, queued the Tauri build, raised a tight sub-decision issue).

- **Web polish shipped (committed `b081dde`):** a **timeline activity strip** under the scrubber — one bar per scrubber step, height ∝ per-window signal count, current window highlighted, click-to-scrub. Reuses the tested core via a new pure `windowCounts()` (composes `inWindow`; counts only, no coords, no sub-window precision). Bars share the exact `LIVE_WINDOW_MS` grid the scrubber walks (1:1). **Tests 57 → 61** (+4); typecheck + build green; `build:core` bundle byte-for-byte unchanged; privacy path + verification mode untouched. TASK-...234 → done.
- **Native track pivoted to Tauri:** closed the superseded Swift tasks (TASK-...1313 was active, TASK-...1315 was candidate) → done/ with superseded notes; the Swift bridge sources stay in-tree as reference only. Created **TASK-...1316** (candidate — Tauri shell wrapping the web app, tray + global hotkey). Raised **ISSUE-...1317** (pending — the few remaining Tauri sub-decisions: Rust toolchain presence, tray/hotkey→SignalStore mechanism, shortcut binding, close-to-tray, packaging scope; defaults proposed).
- **Learnings recorded:** Preferences now codify "wrap the web app in a thin native shell, never a parallel native privacy rewrite" and "pick a toolchain that actually builds here."

## Snapshot
- Tasks: candidates 1 (TASK-...1316 Tauri shell) · ready 0 · active 0 · done 8 (+TASK-...234, +closed Swift ...1313/...1315)
- Issues: **pending 1 (ISSUE-...1317 Tauri sub-decisions)** · approved 4 (+...1314, answered "Tauri") · rejected 2
- Reviews: 0 pending (5 processed)
- App: web app builds; `npm run dev` → http://localhost:5173/ ; **tests 61/61** (+4 windowCounts). `npm run build:core` still produces the (now reference-only) JSC bundle, unchanged.
- Issue gate: **1/10 — clear**. Config: refresh_minutes=1, unanswered_issue_limit=10.

## Now / Next
- **User (decision needed)**: answer **ISSUE-...1317** — confirm the Tauri sub-decisions (a one-liner "defaults OK, Rust installed" suffices) so the next loop can scaffold the Tauri shell. Key items: is Rust/cargo installed? tray/hotkey send via a frontend event (recommended)? shortcut = `Cmd+Shift+Space`? close-to-tray? this-OS bundle only?
- **Loop #11 (if ISSUE-...1317 approved)**: plan + scaffold **TASK-...1316** — add a Tauri project pointing at the existing Vite app (no UI fork), tray menu, `global-shortcut` plugin firing the unchanged `sendSignal()` path; verify `tauri dev`, keep `npm test`/`npm run build` green. (Probe Rust first; if absent, pause and surface the install.)
- **Loop #11 (if ISSUE-...1317 still pending/rejected)**: continue web polish on the demo spine (e.g. demo-facing copy / reliability pass, GOAL #6 / milestone M6), since the web app is the working demo and Tauri wraps it.
- **User live-test (web app, the demo spine)**: http://localhost:5173/ — Demo mode → the new **activity strip** under the scrubber shows where the noticing is; click a bar or drag to scrub; Play history (2×/4×); Back to live; Density view; Verification mode (off by default).

## Blocked
- **TASK-...1316 (Tauri shell)** — gated on **ISSUE-...1317** (sub-decisions) and on Rust/cargo being installed (to be confirmed in that issue).

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it. Config is `refresh_minutes=1`. A fixed-interval cron is more robust within a running session — switchable on request.
