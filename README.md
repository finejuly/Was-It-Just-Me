<div align="center">

# Was It Just Me?

### A privacy-preserving neighborhood "signal" map — notice something, anonymously, with one gesture.

**▶ Live demo: https://finejuly.github.io/Was-It-Just-Me/**

*Built for Claude Build Day.*

</div>

---

## The idea

You feel a tremor, hear a strange boom, see the power flicker — and you wonder: **was it just me, or did the whole neighborhood notice too?**

"Was It Just Me?" answers that with the lowest-friction signal possible. There is exactly **one action**: *"I noticed something."* No category, no description, no severity, no account. One hotkey (or tap) drops a single anonymous dot on a shared map. When several dots light up the same area in the same minutes, you have your answer — collective noticing, with no one's privacy spent to get it.

It is deliberately **not** a crime-reporting, surveillance, or policing tool. It never asks *what* happened, and it makes no claim that anything did.

## Privacy is the whole point

A naive "drop my location on a map" app would leak exactly the thing it should protect. So privacy is enforced **at capture, on the client, before anything is stored or shown**:

- **Jittered + bucketed + coarsened.** Every signal's coordinates are randomized and snapped to a coarse bucket. The dot you see is never the sender's true location.
- **Raw location is never persisted or transmitted.** The only code that reads the device's real position lives in one file (`src/ui/geo.ts`); its output is routed straight through the privacy transform. The map's zoom is capped so it can never imply finer-than-bucket precision.
- **No identity.** No accounts, no logins, nothing to send.
- **No LLM at runtime.** Claude *built* this app; the app does not depend on Claude or any model to run. It works fully offline / airplane-mode.

> There is a single, **off-by-default** "Verification mode" toggle used only to confirm capture works — it plots the exact point behind a prominent banner and never feeds the shared record store. Leave it off for demos.

## What's in the demo

Visit the [live site](https://finejuly.github.io/Was-It-Just-Me/) — it boots straight into a seeded demo neighborhood:

- **One-gesture send** — press **Space** (web) or the global **⌘/Ctrl + Shift + Space** hotkey (desktop app) to drop a signal from anywhere, no form.
- **The answer headline** — a live "was it just me?" readout that reframes the raw count into a human answer (just you · one other · a few nearby).
- **Privacy-randomized map** — jittered/bucketed dots, recency fade, a fixed (non-pannable) view so the demo stays on-message.
- **Live + history** — a time scrubber over retained signals and a hands-free **▶ Play history** stage control (1× / 2× / 4×) with an activity strip.
- **Heatmap density** — an optional layer that blurs individual contributions into neighborhood density.
- **📍 Use my location** — opt in (on a user gesture, as browsers require) to center on your real area; your signals are *still* blurred to the neighborhood.
- **Desktop menu-bar app** — an optional [Tauri](https://tauri.app/) shell that lives in the macOS menu bar and fires a backgrounded signal via the global hotkey, wrapping the exact same web app (one privacy core, zero native location logic).

## Tech

- **Web app:** [Vite](https://vitejs.dev/) + TypeScript + [Leaflet](https://leafletjs.com/). Pure, dependency-light privacy/aggregation core (`src/core/`) with a unit-test suite (`node --test`, 66 tests).
- **Desktop shell:** [Tauri v2](https://tauri.app/) (Rust) menu-bar/accessory app wrapping the built web app — tray menu + global shortcut + hide-to-tray. The native layer contains **no** location or privacy logic.
- **Hosting:** static `dist/` published to GitHub Pages by a GitHub Actions workflow on every push to `main`.

## Run it locally

```sh
npm install
npm run dev        # → http://localhost:5173/  (boots the seeded demo)
npm test           # 66 unit tests (privacy transform, aggregation, playback…)
npm run build      # typecheck + static build into dist/

# optional desktop menu-bar app (requires the Rust toolchain):
npm run tauri:dev
npm run tauri:build
```

> Requires **Node 22+** (the test runner executes TypeScript directly via `node --test`).

## How it was built — Loop Engineering

This repo is also an experiment in **autonomous, iterative LLM development** ([Loop Engineering](https://addyosmani.com/blog/loop-engineering/)). Claude Code ran as a self-directed loop: each iteration read persistent state from an Obsidian vault (`vault/`), planned, implemented, reviewed its own work, and surfaced decisions to the human only when needed.

- [`IDEA.md`](IDEA.md) — the original product brief.
- [`vault/Loop/`](vault/Loop/) — the loop's living state: PRD, goals, progress, the issue/task state machines, and learned preferences.
- [`vault/Run Log/`](vault/Run%20Log/) — a per-iteration history of how the app was built, decision by decision (including the publish-and-deploy saga).
- [`vault/Reviews/`](vault/Reviews/) — user feedback fed back into the loop.

The product itself, to be clear, carries no runtime dependency on any of this — Claude was the builder, not a component.

## Non-goals

No crime reporting · no surveillance/policing · no classifying *what* happened · no claim that anything *did* happen · no exact-location display or re-identification · no accounts · no emergency-service role · no LLM runtime dependency.
