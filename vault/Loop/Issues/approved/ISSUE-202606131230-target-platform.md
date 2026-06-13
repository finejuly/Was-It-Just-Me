---
id: 202606131230
title: Which platform should the MVP target for the live demo?
status: approved
type: decision
created: 2026-06-13
resolved: 2026-06-13
decision: Option 1 — Web app (TypeScript)
raised_by: loop-discovery
blocks: TASK-202606131233, TASK-202606131234
---

> **Resolved 2026-06-13 (loop #3):** Approved as recommended → **Option 1, Web app (TypeScript)**. Recorded in [Preferences.md](../../Preferences.md). Unblocks TASK-202606131233 and TASK-202606131234 (now plannable).


## Context
The PRD requires a global **hotkey** + **background, low-energy operation** (desktop-leaning) *and* **long-press/tap** (touch-leaning), plus a map, heatmap, and a reliable on-stage demo. The platform choice drives how the hotkey/background pieces are built and how the demo is presented. The PRD flags this as the open question blocking implementation planning. See [PRD.md](../../PRD.md) (Hotkey & background behavior; Open product questions) and [GOAL.md](../../GOAL.md).

## Options
1. **Web app (browser).** Fastest to build and demo (just open a URL/projector); rich map libraries. Tradeoff: "global hotkey" and true background operation are limited — would simulate via in-page key handler; geolocation is best-effort.
2. **Desktop app (e.g. Electron/Tauri).** Real global hotkey + background tray operation, matching the PRD literally. Tradeoff: more setup; demo runs from a local binary.
3. **Mobile app.** Most natural long-press + background + location story. Tradeoff: slowest to build and riskiest to demo live (device mirroring, permissions).

## Recommendation
**Option 1 (Web app)** for the hackathon MVP: lowest demo risk and fastest path to the M2+M5 demo spine, with the global-hotkey/background requirements satisfied in spirit via an in-page hotkey and a simulated background arrival in demo mode. Revisit desktop (Option 2) only if a true global hotkey becomes a judged differentiator. Platform-independent core work (signal model, privacy transform, demo simulator) can proceed regardless of this decision.
