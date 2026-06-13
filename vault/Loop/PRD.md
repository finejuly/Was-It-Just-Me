# PRD — Was It Just Me?

_Source of truth. Generated from [IDEA.md](../../IDEA.md). Maintained by `loop-prd`; final writes owned by `loop-orchestrate`._

## Product summary

**Was It Just Me?** is a privacy-preserving neighborhood signal map. When someone notices something unusual nearby — but it isn't clearly an emergency — they send a single, anonymous, ultra-low-friction signal that means only **"I noticed something."** Signals appear on a shared map as privacy-randomized dots (never exact locations), with an optional heatmap and a time scrubber for live and historical views. The app runs quietly in the background so a signal can be sent the instant something is noticed.

It is deliberately **not** a crime-reporting, surveillance, or incident-confirmation tool. It shows only that *people nearby noticed something* — never a claim about what happened.

This is a Claude Build Day hackathon submission; it must be demo-able without real users (see Simulation Mode). **Claude is used to build the app, not as a runtime dependency.**

## Problem

People frequently sense something "off" in their surroundings (an unusual noise, a vibe, a disturbance) that is below the bar for calling emergency services and too vague for structured reporting apps. There's no lightweight way to check *"was it just me, or did others nearby notice it too?"* Existing tools demand classification, identity, and exact location — friction that kills the moment and erodes privacy. The result: a real, common signal goes uncaptured.

## Target users

- **Residents / neighbors** who want a low-stakes way to sense neighborhood activity without surveilling anyone.
- **People in transit / new to an area** seeking ambient awareness ("are others noticing this too?").
- **Privacy-conscious users** who refuse apps that track precise location or identity.
- (Demo audience) **Hackathon judges** evaluating UX, privacy design, and polish in a live demo.

## Goals

- Make sending a signal effectively instant and effortless (hotkey / shortcut / long-press), with no classification step.
- Visualize collective "noticing" while making individual senders' locations **un-inferable**.
- Support both **live** and **historical** exploration (time window + scrub).
- Run quietly in the background at minimal energy cost.
- Ship a compelling, self-contained **demo mode** that doesn't depend on real users.
- Keep the runtime free of any LLM/Claude dependency.

## Non-goals

- ❌ No crime reporting, surveillance, policing, or incident confirmation.
- ❌ No classification of *what* happened (no categories, no severity, no description required).
- ❌ No claim about what actually occurred — only that people noticed something.
- ❌ No exact-location display or storage that could re-identify a sender.
- ❌ No accounts/identity requirements for sending a signal; no LLM at runtime.
- ❌ Not an emergency service or a replacement for one.

## Core UX

- **Primary action:** one gesture → "I noticed something." A single signal is sent. No form, no category, no confirmation friction.
- **Map view:** privacy-randomized dots show recent signals nearby. Dots are intentionally jittered/bucketed.
- **Heatmap view (optional):** density visualization of broader signal activity.
- **Time controls:** toggle live vs. historical; choose a time window; scrub through earlier signals.
- **Quiet by default:** the app sits in the background; sending is always one gesture away.
- **Reassuring framing:** copy answers *"was it just me?"* — it never asserts what the signal means.

## Hotkey & background behavior

- A global **hotkey/shortcut** (desktop) and **long-press/tap** (touch) sends a signal without bringing the app to the foreground or requiring navigation.
- The app runs as a lightweight background process/service with **minimal energy and resource usage**; no continuous high-frequency location polling.
- Location for a signal is sampled **only at send time**, then immediately privacy-transformed before it ever leaves the device (see Privacy rules).
- Sending provides quiet, immediate confirmation (subtle haptic/visual), never a heavy modal flow.

## MVP requirements

1. One-gesture signal send (hotkey + long-press) with no classification.
2. Map view rendering signals as **jittered/bucketed** dots (never exact location).
3. Privacy transform applied at capture (jitter + spatial bucketing) before storage/transmission.
4. Live view of recent signals + a basic **time window** control and **scrub**.
5. Optional **heatmap** density layer.
6. Background/quiet operation with low energy footprint.
7. **Demo mode** that simulates a believable, controllable scenario end-to-end.
8. Local persistence of (privacy-transformed) signals sufficient for historical replay.
9. No runtime LLM/Claude dependency; works fully offline for the demo.

## Map behavior

- Signals render as **dots** at privacy-randomized positions, not true coordinates.
- Two complementary privacy mechanisms: **jitter** (random offset within a radius) and **bucketing** (snap to a coarse grid / geohash cell). Either makes a single dot non-locating; together they prevent triangulation across repeated signals.
- **Heatmap** aggregates density over a region so individual contributions blur into the crowd.
- Map shows *recency* (e.g., fade older dots) and supports pan/zoom; zoom never reveals finer-than-bucket precision.
- A minimum-aggregation threshold may be applied before showing activity in sparse areas (avoid pinpointing a lone sender).

## Privacy rules

- **The sender's real location must never be inferable** from the displayed data, the stored data, or any combination of signals.
- Apply jitter **and** bucketing at capture time, client-side, before any persistence/transmission.
- Bucket resolution is coarse enough that a cell contains many plausible origins; jitter offset is randomized per signal (not a fixed offset that could be subtracted out).
- No identity, device id, or precise timestamp that could de-anonymize; timestamps coarsened (e.g., to the minute/window) for display/history.
- No raw GPS coordinates stored or sent. No tracking, no persistent per-user trails.
- Sparse-area suppression / k-anonymity-style threshold so a single signal can't be isolated.

## Time & history behavior

- **Live view:** shows recent signals within a rolling window.
- **Historical view:** adjustable **time window** and a **scrubber** to replay earlier activity.
- Stored signals are the privacy-transformed records only; history replay never exposes more precision than live view.
- Older signals decay/fade in the live view but remain available via history within the retained range.

## Simulation (demo) mode

First-class and required — the hackathon demo cannot depend on real users. Demo mode must simulate:
- Signals **appearing nearby** over time (believable cadence and spatial spread).
- **Scattered false/background signals** to show real-world noise.
- **Heatmap changes** as density shifts.
- **Hotkey-triggered** signals (operator can fire signals live on stage).
- **Background behavior** (app quietly running, then a signal arrives).
- **Historical replay** (scrub through a pre-seeded timeline).
- Controllable, deterministic-enough scenarios for a reliable live demo (seedable; pause/resume/speed controls helpful).

## Data model

A signal is intentionally minimal (privacy by design):

| Field | Description |
| --- | --- |
| `id` | Opaque, non-identifying id for the signal. |
| `cell` | Coarse spatial bucket (e.g., geohash/grid cell) after bucketing. |
| `jittered_lat`, `jittered_lng` | Display coordinates after random per-signal jitter within the cell. |
| `t` | Coarsened timestamp (e.g., minute/window granularity). |
| `source` | `real` \| `demo` (so demo data is separable from real signals). |

Explicitly **absent**: raw GPS, user/device identity, category/type/severity, free-text description, exact timestamp. Aggregates (heatmap density per cell/window) are derived from these records.

## Testing requirements

- **Privacy guarantees (highest priority):** unit/property tests that stored & displayed coordinates never equal raw input; jitter is randomized per signal and bounded; bucketing snaps to the configured resolution; sparse-area suppression triggers below the threshold; no raw GPS/identity fields are ever persisted or transmitted.
- **Signal send:** one-gesture send produces exactly one privacy-transformed signal; works from background via hotkey/long-press.
- **Map & heatmap:** dots render at jittered/bucketed positions; heatmap density matches underlying records; zoom never exceeds bucket precision.
- **Time/history:** window filtering and scrub return the correct signal set; history reveals no more precision than live.
- **Demo mode:** seeded scenario reproduces nearby signals, false signals, heatmap shifts, hotkey-fired signals, and historical replay; demo data is flagged `source: demo` and isolatable.
- **No-LLM runtime:** app builds and runs the full demo with no network/LLM dependency.

---

### Open product questions
- **Sender platform under revision (ISSUE-202606131310):** the map/view is a web app, but per Review 5 the *send* path should become a **standalone app** (true global hotkey, background/tray) because opening a browser to send is too slow. Recommendation: Tauri v2 (reuses the existing TS core/UI). This revisits the original web-app decision (ISSUE-202606131230) for the sending experience specifically.

### Changelog
- 2026-06-13 — Initial PRD generated from IDEA.md (`loop-prd`).
- 2026-06-13 (loop #7) — Web app now reads **real geolocation** at send time (routed through the privacy transform) instead of a fixed center, and adds an **off-by-default verification mode** (exact location, privacy disabled, clearly labeled) for testing. Sender-platform pivot to a standalone app under decision (ISSUE-202606131310).
