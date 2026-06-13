# Progress

_Last updated: 2026-06-13 13:40_

## Status
Loop resumed after an idle stop (self-paced wakes only fire while the session is active) and processed Review 5 in full. The web app now reads **real geolocation** at send time (privacy-transformed) and has an off-by-default **verification mode** for exact-location testing; the >3 km report was the app using the fixed SF demo center, not a privacy/transform bug. Run Logs are now one-file-per-loop. The **standalone-sender pivot** (Review 5.3) is captured as a decision issue.

## Snapshot
- Tasks: candidates 1 (TASK-...234 UI remainder) · ready 0 · active 0 · done 4
- Issues: pending 1 (ISSUE-...1310 standalone app) · approved 2 · rejected 1
- Reviews: 0 pending (5 processed)
- App: builds; `npm run dev` → http://localhost:5173/ ; tests 42/42; geolocation + verification mode added (privacy verifier PASS)
- Issue gate: 1/5 — clear · config: refresh_minutes=3

## Now / Next
- **User**: (a) live-test geolocation + verification mode at http://localhost:5173/ (allow location; toggle Verification mode); (b) decide **ISSUE-...1310** (standalone sender — recommend Tauri v2) by moving it in `Issues/`.
- **If Tauri approved**: first task installs Rust + scaffolds `src-tauri/` (global hotkey + tray, reusing the TS core) and pre-builds the demo binary.
- **Remaining product polish**: history/heatmap UX (TASK-...234).

## Blocked
- None blocking. ISSUE-...1310 gates only the standalone-sender build, not testing the current web app.

## Note on loop durability
This loop is **session-scoped**: it advances only while this session is active and will stop again if the session idles/closes. A fixed-interval cron (`*/3 * * * *`) is more robust within a running session — switchable on request.
