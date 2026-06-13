# Loop #8 — 2026-06-13

- **Entry state**: 0 pending issues, 0 top-level reviews. User had moved ISSUE-...1310 (standalone sender) to `Issues/rejected/` (uncommitted). Web app green from loop #7 (42/42 tests).
- **Config applied**: refresh_minutes=3, unanswered_issue_limit=10. Issue gate clear (0/10 at entry).
- **Modules run**: Review-triage (none pending) · Issue handling · Implementation · Progress/Run-Log.

- **Reviews**: none top-level (5 already processed). Nothing to triage.

- **Issue handling**:
  - Annotated **ISSUE-...1310** → `status: rejected` + resolution note ("stay on the web app; no Tauri/Electron pivot this loop").
  - **Conflict surfaced, not guessed**: the rejected ...1310 file carried a hand-written `# Response` reading *"Implement Native menu-bar app"* (Option 3) — contradicts both the `rejected/` location and the "reuse, don't rewrite" preference (native = rewrite the tested TS core in Swift, no Leaflet reuse). Did **not** start a native app. Raised **ISSUE-...1312** (pending) asking the user to confirm: stay web (recommended) vs native vs Tauri/Electron.

- **Increment implemented — demo-mode stage playback (GOAL M5 "stage controls")**:
  - New pure module **`src/sim/playback.ts`** — `advancePlayback()` deterministic clock (clamp, forward-only, end detect, sub-step carry); `PLAYBACK_SPEEDS=[1,2,4]`. No DOM/timer/privacy data.
  - New tests **`src/sim/playback.test.ts`** — 8 cases.
  - **`src/main.ts`** — Play/Pause + speed wiring; owns only a 100ms `setInterval`, delegates stepping to the pure module; manual scrub / Back-to-live / leaving demo all stop playback; loops at end for unattended stage replay; starts **paused**.
  - **`index.html`** — `.playback-row` (Play btn + speed select) in time panel, shown only while Demo mode on.
  - **`src/styles.css`** — playback row / speed select / pressed-state styles.
  - Reused `core/*` and `sim/simulator.ts` unchanged. Privacy path untouched (playback moves the view cursor only); verification mode + privacy defaults unchanged.

- **Verification (orchestrator, main tree)**: `npm run typecheck` clean · `npm run build` ok (17 modules) · `npm test` **50/50** (was 42; +8). **Not verified**: live browser click-through (left to user); dev server already up at :5173.

- **Task lifecycle**: created **TASK-...1312-demo-stage-playback** directly in `Tasks/done/` (completed this loop). TASK-...234 (history/heatmap UX) stays a candidate.

- **Commit**: small commit on `main` (no branch, no push, no PR; workspace.json excluded). Hash recorded in the loop summary.

- **Stop reason**: one focused non-gated increment shipped + verified; one clarifying issue pending. Awaiting user on ISSUE-...1312 and a live browser test.
