---
id: 202606131313
title: Native menu-bar signal-sender app (Swift/SwiftUI NSStatusItem, global hotkey + tray)
status: active
priority: high
source: ISSUE-202606131312 (approved: native) + ISSUE-202606131310 Option 3
created: 2026-06-13
planned: 2026-06-13 (loop #9)
blocked_by: none (decision approved)
---

## Summary
User approved a **native macOS menu-bar app** (Option 2 of ISSUE-...1310; confirmed via ISSUE-...1312 `# Response: Native`) for the *send* path: a `NSStatusItem` tray app with a true **OS-global hotkey** and quiet background operation, matching the PRD "Hotkey & background behavior." The existing web app stays the **map/view** and the instant demo fallback.

## Chosen reuse strategy (resolved during planning, loop #9)
Of the three options in the candidate, **Option 1 — embed JavaScriptCore (JSC) and call the UNCHANGED privacy core** is chosen and locked for this build:
- JSC ships with macOS (`import JavaScriptCore`) — **no extra toolchain, no Rust, no npm at runtime**; honors "no LLM/network at runtime" and "reuse, don't rewrite".
- The privacy spine (`src/core/privacy.ts` + `src/core/geohash.ts`) is pure and dependency-free, so it compiles to a tiny self-contained JS bundle. Swift evaluates that bundle in a `JSContext` and calls `transformSignal(...)` — **the exact tested code path**, byte-for-byte the same privacy guarantee. Swift owns ONLY hotkey/tray/IPC; it writes **zero** privacy logic.
- Rejected: Option 2 (port to Swift) = a second privacy implementation to keep correct, against the highest-priority guarantee — too risky pre-deadline. Option 3 (WKWebView hosting Leaflet) is a fine *later* path for showing the map inside the native shell, but the *send* path only needs the core, and JSC is lighter for a background tray app.

## Plan (incremental — this loop lands increment A; B is the follow-up)

This is a large multi-step build. To keep it user-testable and low-risk, split into two increments. **This loop implements increment A** (the de-risking spine: prove Swift→JSC→tested core parity, offline). Increment B (the actual `NSStatusItem` GUI app bundle + global hotkey) is queued as a follow-up task once A is green.

### Increment A — privacy-core JS bridge + Swift parity harness (THIS LOOP)
1. **Bundle the core for JSC.** Add an npm script `build:core` that bundles **only** `src/core/privacy.ts` (+ its `geohash.ts` import) into one classic-script JS file at `native/Resources/wijm-core.js` that exposes a global `globalThis.WIJM = { transformSignal, visibleCells }`. Use Vite/esbuild in **IIFE/lib mode** (no ESM `import`/`export` in the output — JSC evaluates a plain script, not a module). Add a thin entry `src/core/bridge.ts` that re-exports the wanted symbols onto `globalThis.WIJM` so the build has a single named entry. No new runtime deps (esbuild ships with Vite).
   - Privacy note: `transformSignal`'s default RNG uses `globalThis.crypto.getRandomValues` and `crypto.randomUUID`. JSC does **not** provide Web Crypto. The bridge must accept an injected `rng`/`newId` from Swift (Swift passes a `SecRandomCopyBytes`-backed float fn + a UUID string), OR the bridge installs a small `crypto` shim before calling the core. Prefer **injection** (keeps the core untouched and the randomness source auditable from Swift). Document this in `bridge.ts`.
2. **Swift package** at `native/WIJMCore/` (SwiftPM, `Package.swift`, no Xcode project yet so it builds headlessly with `swift build`/`swift test`):
   - `WIJMCore` library target: a `SignalCore` type that loads `wijm-core.js` into a `JSContext`, exposes `func transform(lat:lng:tsMillis:source:) -> SignalRecord` calling `WIJM.transformSignal` with a Swift-provided CSPRNG (`SecRandomCopyBytes`) and UUID. `SignalRecord` is a Swift `Codable` struct mirroring `{id, cell, jittered_lat, jittered_lng, t, source}` — **exactly** those fields, nothing more (no raw lat/lng field exists on the Swift type either).
   - The JS bundle is loaded from the target's resources (`Bundle.module`), copied in via `build:core`.
3. **Swift parity tests** (`swift test`, `XCTest` target `WIJMCoreTests`) proving the privacy guarantee holds through the bridge — mirror the TS `privacy.test.ts` invariants:
   - stored/displayed coords **never equal** the raw input lat/lng;
   - jittered point lies **within** the decoded geohash cell bounds (bounded jitter);
   - same raw point fired twice yields **different** jittered points (per-signal randomness; defeats triangulation);
   - the returned record has **only** the six allowed keys — assert no `lat`/`lng`/`raw`/identity field leaks through;
   - `source` round-trips as `"real"`/`"demo"`.
4. **Wire into the JS test/build story** so nothing regresses: `npm run build:core` must produce the bundle; existing `npm test` (50/50) and `npm run build` stay green and untouched. Add a `native/README.md` (allowed — it's product/dev doc for a new subsystem, not a vault doc) with the two build/test commands.

### Increment B — NSStatusItem GUI app + global hotkey (FOLLOW-UP TASK, not this loop)
- `NSStatusItem` menu-bar app (SwiftUI/AppKit), launches hidden/quiet, tray menu: "I noticed something" + Show map (opens web app) + Quit.
- **True global hotkey** (Carbon `RegisterEventHotKey` or `MASShortcut`) fires `SignalCore.transform(...)` while unfocused/backgrounded → appends the record to the **shared store** the web map reads (decide IPC: shared JSON file the web app polls, or a tiny localhost endpoint — raise as a sub-decision if non-obvious).
- Quiet confirmation (tray flash / sound), low idle energy. Keep the in-browser Space hotkey + web build intact as the instant fallback.

## Acceptance criteria (increment A — this loop)
- [ ] `npm run build:core` produces `native/Resources/wijm-core.js` (or the SwiftPM resource path), a single classic script, no ESM import/export, exposing `WIJM.transformSignal`.
- [ ] `swift build` succeeds in `native/WIJMCore/` using only macOS-bundled JavaScriptCore (no third-party Swift deps).
- [ ] `swift test` passes, with parity tests asserting: jitter within cell bounds; output never equals raw input; two fires of the same point differ; record has exactly the six allowed fields (no raw/identity leak); source round-trips.
- [ ] Runs fully offline: no network, no npm, no LLM at run time (JSC evaluates a local script; randomness from `SecRandomCopyBytes`).
- [ ] Existing JS suite still 50/50 and `npm run build` still green; web app untouched and still the map/view + fallback.
- [ ] Follow-up task for increment B (NSStatusItem GUI + global hotkey) created as a candidate.

## Test notes
- Parity tests are the privacy guarantee for the native path — they are the highest priority and must be deterministic. Inject a fixed/seeded rng from Swift where determinism is needed (e.g. "within cell bounds" can use the real CSPRNG and just assert bounds; "two fires differ" uses the CSPRNG; a seeded fn can prove a known point→known cell).
- Verify the "exactly six fields" check by serializing the JS return value to JSON in Swift and asserting the key set == {id, cell, jittered_lat, jittered_lng, t, source}.
- Manual: `cd native/WIJMCore && swift test` should be the single command the user can run to verify privacy parity offline.

## Risks / privacy considerations
- **Highest risk = re-leaking real location.** Mitigated by reusing the *unchanged* core (no second privacy implementation) and asserting the six-field schema + bounded jitter in Swift tests.
- JSC has no Web Crypto: handle via Swift-injected `SecRandomCopyBytes` rng + UUID (the core already supports `opts.rng`/`opts.newId` injection), so we don't shim crypto inside the bundle. Keeps the randomness source auditable in Swift.
- Bundle must be a **classic script**, not an ES module — JSC `evaluateScript` does not resolve `import`. Verified the core is pure (only intra-core import is `geohash.ts`), so an IIFE bundle inlines cleanly.
- Keep increment A headless (SwiftPM, no `.app` bundle) so it builds/tests in CI-like fashion without Xcode UI; the GUI bundle is increment B.

## Notes
- Toolchain present (probed): Xcode CLT, **Swift 6.2.1**, `swift`/`xcodebuild` on PATH, Homebrew, Node 24. No Rust needed for the JSC route.
- Keep the in-browser Space hotkey + web build intact as the instant demo fallback.

## Outcome — loop #9 (2026-06-13) — PARTIAL; JS half green, Swift half BLOCKED by toolchain
**Status kept `active`** (not `done`): the Swift acceptance criteria could not be verified in this environment. Honest breakdown vs. the increment-A criteria:

- [x] `npm run build:core` → `native/WIJMCore/Sources/WIJMCore/Resources/wijm-core.js` — a single **classic IIFE** script (esbuild, 4KB), no ESM, exposing `WIJM.transformSignal`/`visibleCells`. Verified it evaluates and returns a correct 6-field record in a JS engine.
- [x] **Bridge contract test-verified offline NOW**: new `src/core/bridge.test.ts` (7 tests) pins the exact injected-rng signature Swift calls and asserts the privacy invariants (bounded jitter within cell, no raw/identity leak, per-signal scatter, source round-trip). `npm test` **57/57** (was 50; +7). `npm run typecheck` + `npm run build` green; web app untouched.
- [x] Swift sources written: `Package.swift` (JSC-only, no third-party deps), `SignalCore.swift` (loads bundle into a `JSContext`, injects `SecRandomCopyBytes` rng + UUID, decodes + asserts the 6-field key set at the boundary), `Tests/WIJMCoreTests/SignalCoreTests.swift` (12 parity tests mirroring `privacy.test.ts`).
- [ ] **`swift build` / `swift test` BLOCKED** — machine-level toolchain/SDK skew: `swiftc` reports the SDK was built with `swiftlang-6.2.1.4.7` while the compiler is `swiftlang-6.2.1.4.8`. This breaks **ALL** Swift compilation (proven with a trivial empty SwiftPM package *and* a one-file `swiftc` build — both fail identically), so it is **not** a defect in this package. Cannot be fixed from inside the loop (needs user to realign Command Line Tools / `xcode-select`). Raised as a pending issue (ISSUE-...1314).
- [x] Documented in `native/README.md` (build/test commands + the blocker).
- [ ] Follow-up task for increment B (NSStatusItem GUI + global hotkey) — created as candidate TASK-...1315.

**Resume plan (loop #10+):** once the user confirms the toolchain is realigned (per ISSUE-...1314), run `cd native/WIJMCore && swift build && swift test` — expected to pass unchanged since the JS contract is already verified — then move this task to `done` and proceed to increment B.

## Closed — loop #10 (2026-06-13) — SUPERSEDED by the Tauri pivot
User answered ISSUE-...1314 with **"Let's move to Tauri then."** The Swift→JSC native
route is **superseded**: Tauri wraps the existing web app directly, so the JSC bridge
(this task's deliverable) is no longer needed for the send path — the privacy core runs
in Tauri's webview natively. The Swift bridge sources (`native/WIJMCore/`) remain in-tree
as a reference artifact but are off the build path. The JS-half work from loop #9 (the
`build:core` bundle + `bridge.test.ts`, 57→ later 61 tests) stays green and harmless.
Closed (not "done" in the original sense) — moved to done/ to clear the active pipeline.
Follow-on work tracked by **TASK-...1316** (Tauri shell) + **ISSUE-...1317** (Tauri sub-decisions).
