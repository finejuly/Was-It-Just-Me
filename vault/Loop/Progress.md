# Progress

_Last updated: 2026-06-13 (loop #8)_

## Status
Staying on the **web app** — the standalone-sender pivot (ISSUE-...1310) was rejected by the user (moved to `Issues/rejected/`). Loop #8 shipped the next demo-spine increment: **demo-mode stage playback** (Play/Pause + 1×/2×/4× speed) that auto-advances the seeded historical timeline, so "historical replay" runs hands-free on stage (GOAL M5). Stepping logic is a new pure, tested module; UI owns only the ticker. Tests up to 50/50.

A genuine conflict was surfaced rather than guessed: the rejected ISSUE-...1310 file also carried a hand-written note "Implement Native menu-bar app" (Option 3). Loop #8 did **not** start a native app; it raised **ISSUE-...1312** to confirm intent. **The user then answered in real time** — moved ...1312 to `Issues/approved/` with `# Response: Native`. **Decision is now unambiguous: build the native macOS menu-bar app** (Swift/SwiftUI `NSStatusItem`, true global hotkey + tray) for the *send* path, accepting the rewrite cost; the web app stays the map/view + instant fallback. This is a large multi-step build, so it is queued for loop #9 (TASK-...1313), not rushed into the tail of this iteration.

## Snapshot
- Tasks: candidates 2 (TASK-...234 history/heatmap UX; TASK-...1313 native menu-bar sender) · ready 0 · active 0 · done 5
- Issues: pending 0 · approved 3 (incl. ISSUE-...1312 native) · rejected 2 (ISSUE-...1302 offline basemap, ISSUE-...1310 standalone-app framing)
- Reviews: 0 pending (5 processed)
- App: builds; `npm run dev` → http://localhost:5173/ ; **tests 50/50**; geolocation + verification mode (off by default) + demo stage playback added
- Issue gate: 0/10 — clear · config: refresh_minutes=3, unanswered_issue_limit=10

## Now / Next
- **Loop #9 (top priority)**: plan + start **TASK-...1313 — native menu-bar sender** (approved). Plan must preserve the tested privacy guarantee (prefer embedding JavaScriptCore / a `WKWebView` over rewriting the core); add a global hotkey + tray; keep the web app as fallback. No Rust needed (Swift 6.2 + Xcode CLT present).
- **User**: live-test the web app at http://localhost:5173/ — Demo mode → press **Play history**, try 2×/4×, scrub manually (should pause), "Back to live"; plus the earlier geolocation + Verification-mode check.
- **Remaining web polish**: history/heatmap UX (TASK-...234).

## Blocked
- None. Native-sender decision is approved and ready to plan.

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it. A fixed-interval cron (`*/3 * * * *`) is more robust within a running session — switchable on request.
