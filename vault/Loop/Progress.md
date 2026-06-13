# Progress

_Last updated: 2026-06-13 (loop #9)_

## Status
Started the approved **native macOS menu-bar sender** (TASK-...1313). Loop #9 built **increment A** — the privacy bridge that lets the Swift app reuse the **unchanged, tested TS privacy core** through JavaScriptCore, so Swift writes **zero** privacy logic (honors "reuse, don't rewrite" + the highest-priority privacy guarantee). The **JS half is done and verified offline**; the **Swift half is written but cannot be built here** due to a machine-level toolchain skew.

- **JS bridge (green):** `src/core/bridge.ts` exposes a narrow `WIJM.transformSignal` with injected rng+id (JSC lacks Web Crypto). `npm run build:core` esbuild-bundles the core to a classic IIFE script (`native/WIJMCore/.../Resources/wijm-core.js`, 4KB, no ESM, no runtime deps). New `src/core/bridge.test.ts` pins the exact contract Swift calls + privacy invariants. **Tests 50 → 57**; typecheck + build green; **web app untouched**.
- **Swift (written, unverified):** `native/WIJMCore/` SwiftPM package (JSC only) — `SignalCore.swift` loads the bundle into a `JSContext`, injects `SecRandomCopyBytes` rng + UUID, decodes + asserts the six-field schema at the boundary; XCTest parity suite mirrors `privacy.test.ts`.
- **Blocker (raised, not guessed):** `swift build`/`swift test` fail with an SDK-vs-compiler skew (SDK `swiftlang-6.2.1.4.7` vs compiler `...4.8`) that breaks **all** Swift compilation — proven with a trivial empty package *and* a one-file `swiftc` build, so it is **not** a defect in our code. Raised **ISSUE-...1314** asking the user to realign the Command Line Tools (or defer the native build for the hackathon).

## Snapshot
- Tasks: candidates 2 (TASK-...234 history/heatmap UX; TASK-...1315 native GUI+hotkey [inc. B]) · ready 0 · **active 1 (TASK-...1313 — JS half green, Swift blocked)** · done 5
- Issues: **pending 1 (ISSUE-...1314 toolchain skew)** · approved 3 · rejected 2
- Reviews: 0 pending (5 processed)
- App: web app builds; `npm run dev` → http://localhost:5173/ ; **tests 57/57** (+7 bridge contract); `npm run build:core` produces the JSC bundle. Native package present but unbuildable until the toolchain is fixed.
- Issue gate: **1/10 — clear** · config: refresh_minutes=1, unanswered_issue_limit=10

## Now / Next
- **User (decision needed)**: answer **ISSUE-...1314** — realign the Swift toolchain (Option 2 if Xcode.app is installed: `xcode-select -s /Applications/Xcode.app/...`; else reinstall CLT), or defer the native sender and ship the web demo. Resolve before loop #10 can verify the Swift half.
- **Loop #10 (if toolchain fixed)**: run `cd native/WIJMCore && swift build && swift test` (expected green — the JS contract is already verified), then mark TASK-...1313 **done** and plan/start increment B (TASK-...1315: NSStatusItem GUI + global hotkey + IPC to web map).
- **Loop #10 (if toolchain deferred)**: keep the Swift bridge in-tree; pivot to remaining **web polish** — history/heatmap UX (TASK-...234) — so the loop stays productive on the working demo.
- **User live-test (web app, still the demo spine)**: http://localhost:5173/ — Demo mode → Play history (2×/4×), manual scrub, Back to live; geolocation + Verification-mode (off by default).

## Blocked
- **TASK-...1313 Swift verification** — blocked by **ISSUE-...1314** (toolchain SDK/compiler skew; user action required). JS half is unblocked and green.
- **TASK-...1315** (increment B) — blocked by TASK-...1313 going green (and thus by ISSUE-...1314).

## Note on loop durability
Loop is **session-scoped**: advances only while this session is active; idles/closes stop it. Config is now `refresh_minutes=1`. A fixed-interval cron is more robust within a running session — switchable on request.
