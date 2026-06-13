// "Was It Just Me?" — app entry. Wires the tested pure cores (privacy, aggregate,
// simulator) to a Leaflet map, a time scrubber, and the one-gesture signal send.
//
// Privacy posture of this file: it only ever touches privacy-safe SignalRecords
// and densityGrid cell centers. There are no raw coordinates anywhere in the
// runtime — the simulator and triggerSignal both route through transformSignal,
// which is the only place a raw point ever briefly exists, and it never escapes.

import "leaflet/dist/leaflet.css";
import { triggerSignal, generateScenario } from "./sim/simulator.ts";
import {
  advancePlayback,
  type PlaybackSpeed,
} from "./sim/playback.ts";
import { inWindow, timeBounds, windowCounts } from "./core/aggregate.ts";
import { transformSignal, type SignalRecord } from "./core/privacy.ts";
import { SignalStore } from "./ui/store.ts";
import { MapView } from "./ui/mapView.ts";
import { getCurrentPosition, type GeoFix } from "./ui/geo.ts";
import {
  DEMO_CENTER,
  DEMO_SEED,
  LIVE_WINDOW_MS,
} from "./ui/config.ts";

const store = new SignalStore();
const mapView = new MapView("map", DEMO_CENTER);

// --- DOM handles ---------------------------------------------------------
const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

const scrubber = $<HTMLInputElement>("scrubber");
const activityStrip = $<HTMLDivElement>("activity-strip");
const timeMode = $<HTMLSpanElement>("time-mode");
const timeReadout = $<HTMLSpanElement>("time-readout");
const liveBtn = $<HTMLButtonElement>("live-btn");
const noticeBtn = $<HTMLButtonElement>("notice-btn");
const confirmEl = $<HTMLDivElement>("confirm");
const demoToggle = $<HTMLInputElement>("demo-toggle");
const heatmapToggle = $<HTMLInputElement>("heatmap-toggle");
const verifyToggle = $<HTMLInputElement>("verify-toggle");
const verifyBanner = $<HTMLDivElement>("verify-banner");
const playbackRow = $<HTMLDivElement>("playback-row");
const playBtn = $<HTMLButtonElement>("play-btn");
const speedSelect = $<HTMLSelectElement>("speed-select");

// --- View state ----------------------------------------------------------
// `live` true => follow the newest window. `live` false => show the window at
// the scrubber's position (historical replay). The scrubber's integer value is
// an offset (in LIVE_WINDOW_MS steps) from the timeline's start.
let live = true;

// The user's most recent REAL location, if geolocation succeeded. Raw coords
// live here only transiently in-memory and are never persisted; the normal send
// path immediately routes them through transformSignal (privacy on).
let realFix: GeoFix | null = null;

// --- Demo stage playback -------------------------------------------------
// Auto-advances the scrubber through the seeded timeline so the operator can
// show historical replay hands-free. The stepping math is the pure, tested
// playback clock (sim/playback.ts); here we only own the ticker + DOM. Playback
// is a demo-only convenience and starts OFF (no auto-motion until the operator
// presses Play); it never touches the privacy path — it just moves the view.
const PLAYBACK_TICK_MS = 100; // smooth-enough cursor without busy work
let playTimer: number | undefined;
let playSpeed: PlaybackSpeed = 1;
let lastTickAt = 0;
let carryMs = 0;

function isPlaying(): boolean {
  return playTimer !== undefined;
}

function setPlayLabel(): void {
  playBtn.textContent = isPlaying() ? "⏸ Pause" : "▶ Play history";
  playBtn.setAttribute("aria-pressed", String(isPlaying()));
}

function stopPlayback(): void {
  if (playTimer !== undefined) {
    window.clearInterval(playTimer);
    playTimer = undefined;
  }
  setPlayLabel();
}

function tickPlayback(): void {
  const max = Number(scrubber.max);
  const now = Date.now();
  const elapsed = now - lastTickAt;
  lastTickAt = now;

  const { step, reachedEnd, carryMs: carry } = advancePlayback(
    Number(scrubber.value),
    max,
    playSpeed,
    elapsed,
    carryMs,
  );
  carryMs = carry;
  scrubber.value = String(step);
  // While playing we are in historical replay; only the final frame is "live".
  live = step >= max;
  refresh(store.all());

  if (reachedEnd) {
    // Loop the seeded scenario so an unattended stage demo keeps cycling.
    stopPlayback();
    window.setTimeout(() => {
      if (!demoToggle.checked) return; // demo was turned off meanwhile
      scrubber.value = "0";
      live = false;
      refresh(store.all());
      startPlayback();
    }, 900);
  }
}

function startPlayback(): void {
  if (isPlaying()) return;
  // Begin from the start of history if we're already sitting at live, so Play
  // always shows the lead-up rather than doing nothing at the end.
  if (Number(scrubber.value) >= Number(scrubber.max)) {
    scrubber.value = "0";
    live = false;
  }
  carryMs = 0;
  lastTickAt = Date.now();
  playTimer = window.setInterval(tickPlayback, PLAYBACK_TICK_MS);
  setPlayLabel();
  refresh(store.all());
}

function togglePlayback(): void {
  if (isPlaying()) stopPlayback();
  else startPlayback();
}

function loadDemo(): void {
  // Stamp the scenario across the recent past so "live" shows current activity
  // and the scrubber can replay the lead-up.
  const now = Date.now();
  const durationMs = 60 * 60 * 1000; // one hour of history
  store.set(
    generateScenario({
      seed: DEMO_SEED,
      center: DEMO_CENTER,
      startT: now - durationMs,
      durationMs,
    }),
  );
  live = true;
}

function fmt(t: number): string {
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * The window currently being viewed, plus the scrubber grid it sits on.
 * `startT` + `steps` describe the timeline the scrubber (and the activity strip)
 * step over in LIVE_WINDOW_MS increments; `index` is the current scrubber step.
 */
interface ViewWindow {
  fromT: number;
  toT: number;
  startT: number; // timeline origin = bounds.minT (grid start for windowCounts)
  steps: number; // number of scrubber steps (== bars in the activity strip)
  index: number; // current step the view is showing (0..steps)
}

/** Compute the window currently being viewed and the grid it lives on. */
function currentWindow(records: readonly SignalRecord[]): ViewWindow | null {
  const bounds = timeBounds(records);
  if (bounds === null) return null;
  // Scrubber spans [minT, maxT] in LIVE_WINDOW_MS steps.
  const span = Math.max(0, bounds.maxT - bounds.minT);
  const steps = Math.max(1, Math.ceil(span / LIVE_WINDOW_MS));
  scrubber.max = String(steps);

  if (live) {
    scrubber.value = String(steps);
    const toT = bounds.maxT + 1; // inclusive of the newest window's records
    return {
      fromT: toT - LIVE_WINDOW_MS,
      toT,
      startT: bounds.minT,
      steps,
      index: steps,
    };
  }

  const offset = Number(scrubber.value);
  const fromT = bounds.minT + offset * LIVE_WINDOW_MS;
  return {
    fromT,
    toT: fromT + LIVE_WINDOW_MS,
    startT: bounds.minT,
    steps,
    index: offset,
  };
}

/**
 * Render the activity strip: one bar per scrubber step, height = per-window
 * signal count (aggregate only — never per-sender, never coords). Bars line up
 * 1:1 with the scrubber because both walk the same LIVE_WINDOW_MS grid from
 * `startT`. The bar at the current `index` is highlighted. Clicking a bar scrubs
 * to that window. Counts come from the tested pure core (`windowCounts`).
 */
function renderStrip(records: readonly SignalRecord[], win: ViewWindow): void {
  // `steps` bars cover the historical frames [0..steps-1]; the live tail sits at
  // index === steps, so we render `steps` bars and treat index===steps as "live".
  const bars = Math.max(1, win.steps);
  const counts = windowCounts(records, win.startT, LIVE_WINDOW_MS, bars);
  const maxCount = counts.reduce((m, c) => Math.max(m, c), 0);

  if (maxCount === 0) {
    activityStrip.hidden = true;
    activityStrip.replaceChildren();
    return;
  }
  activityStrip.hidden = false;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < bars; i++) {
    const bar = document.createElement("button");
    bar.type = "button";
    bar.className = "activity-bar";
    // 6%..100% height so even a 1-count window is visibly a tick, not invisible.
    const h = 6 + (counts[i] / maxCount) * 94;
    bar.style.height = `${h}%`;
    if (i === win.index) bar.classList.add("is-current");
    bar.setAttribute(
      "aria-label",
      `${counts[i]} signal${counts[i] === 1 ? "" : "s"} in this window`,
    );
    bar.title = `${counts[i]} noticed in this window`;
    bar.addEventListener("click", () => {
      stopPlayback();
      scrubber.value = String(i);
      live = false;
      refresh(store.all());
    });
    frag.appendChild(bar);
  }
  activityStrip.replaceChildren(frag);
}

function refresh(records: readonly SignalRecord[]): void {
  const win = currentWindow(records);
  if (win === null) {
    mapView.render([]);
    timeReadout.textContent = "No signals yet";
    activityStrip.hidden = true;
    activityStrip.replaceChildren();
    return;
  }
  const visible = inWindow(records, win.fromT, win.toT);
  mapView.render(visible);
  renderStrip(records, win);

  timeMode.textContent = live ? "Live" : "History";
  liveBtn.hidden = live;
  timeReadout.textContent = `${fmt(win.fromT)} – ${fmt(win.toT)} · ${visible.length} signal${visible.length === 1 ? "" : "s"} in view`;
}

// --- Confirmation (quiet, non-modal) -------------------------------------
let confirmTimer: number | undefined;
function showConfirm(msg: string): void {
  confirmEl.textContent = msg;
  confirmEl.classList.add("show");
  if (confirmTimer !== undefined) window.clearTimeout(confirmTimer);
  confirmTimer = window.setTimeout(() => confirmEl.classList.remove("show"), 1800);
}

// --- One-gesture signal send ---------------------------------------------
function sendSignal(): void {
  let record: SignalRecord;
  if (realFix) {
    // Use the user's REAL location, but route it through the DEFAULT privacy
    // transform so the stored/displayed point is bucketed + jittered + coarsened
    // exactly like every other signal. Raw coords never leave this call.
    record = transformSignal(
      realFix.coords.lat,
      realFix.coords.lng,
      Date.now(),
      "real",
    );
  } else {
    // No real location (denied/unavailable/not yet resolved): fall back to the
    // demo center. triggerSignal also routes through the privacy transform.
    record = triggerSignal(DEMO_CENTER, Date.now());
  }
  store.add(record);
  live = true; // jump back to live so the new signal is visible
  showConfirm(
    realFix
      ? "Thanks — your signal joined the others nearby."
      : "Thanks — added near the demo area (location unavailable).",
  );
}

// --- Real geolocation (UI layer only) ------------------------------------
// On boot, try once to learn the user's real location so the map centers on
// them and their sent signals come from their true area (privacy still applied).
// Failure is non-fatal: we keep the demo center and surface a calm message.
async function initRealLocation(): Promise<void> {
  try {
    const fix = await getCurrentPosition();
    realFix = fix;
    mapView.recenter(fix.coords.lat, fix.coords.lng);
    // If verification mode was switched on before the fix resolved, plot it now.
    if (verifyToggle.checked) plotExactFix(fix);
  } catch (err) {
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "Could not access your location.";
    showConfirm(`${message} Showing the demo area instead.`);
  }
}

// --- Verification mode (debug only; OFF by default; bypasses privacy) -----
// When ON, plot the EXACT captured coordinates with NO jitter/bucketing, behind
// a prominent banner. This is the only path that displays a raw location, and it
// never feeds the privacy-safe record store or alters the default privacy path.
function plotExactFix(fix: GeoFix): void {
  mapView.showExactLocation(fix.coords.lat, fix.coords.lng, fix.accuracyM);
  mapView.recenter(fix.coords.lat, fix.coords.lng);
}

async function setVerificationMode(on: boolean): Promise<void> {
  verifyBanner.hidden = !on;
  if (!on) {
    mapView.clearExactLocation();
    return;
  }
  // Turning it on: (re)request a fresh fix and plot the exact point.
  try {
    const fix = await getCurrentPosition();
    realFix = fix;
    plotExactFix(fix);
  } catch (err) {
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "Could not access your location.";
    showConfirm(`Verification mode: ${message}`);
    // Keep the banner up so the operator sees verification is engaged, but there
    // is no exact point to show without a fix.
    mapView.clearExactLocation();
  }
}

// --- Wiring --------------------------------------------------------------
store.subscribe(refresh);

scrubber.addEventListener("input", () => {
  // A manual scrub takes over from auto-playback.
  stopPlayback();
  live = Number(scrubber.value) >= Number(scrubber.max);
  refresh(store.all());
});

liveBtn.addEventListener("click", () => {
  stopPlayback();
  live = true;
  refresh(store.all());
});

playBtn.addEventListener("click", togglePlayback);

speedSelect.addEventListener("change", () => {
  const v = Number(speedSelect.value);
  playSpeed = (v === 2 || v === 4 ? v : 1) as PlaybackSpeed;
  // Reset the sub-step carry so the new speed takes effect cleanly.
  carryMs = 0;
  lastTickAt = Date.now();
});

noticeBtn.addEventListener("click", sendSignal);

window.addEventListener("keydown", (e) => {
  // Spacebar hotkey — but not while typing in a field or toggling a control.
  if (e.code !== "Space") return;
  const target = e.target as HTMLElement | null;
  const tag = target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
  e.preventDefault();
  sendSignal();
});

heatmapToggle.addEventListener("change", () => {
  mapView.setShowDensity(heatmapToggle.checked);
});

verifyToggle.addEventListener("change", () => {
  void setVerificationMode(verifyToggle.checked);
});

demoToggle.addEventListener("change", () => {
  stopPlayback();
  if (demoToggle.checked) {
    loadDemo();
    playbackRow.hidden = false;
    showConfirm("Demo scenario loaded.");
  } else {
    // Leaving demo mode clears the staged scenario; only live-sent signals
    // (source "demo" from triggerSignal, but operator-fired) would remain. For a
    // clean slate we empty the set so the map reflects real send activity only.
    store.set([]);
    live = true;
    // Playback only makes sense over the seeded timeline; hide it without demo.
    playbackRow.hidden = true;
    showConfirm("Demo cleared — send a signal to see it appear.");
  }
});

// --- Boot ----------------------------------------------------------------
// Verification mode must always start OFF regardless of any cached form state.
verifyToggle.checked = false;
verifyBanner.hidden = true;
// Playback is demo-only and starts paused; show its controls iff demo is on.
playSpeed = 1;
speedSelect.value = "1";
setPlayLabel();
playbackRow.hidden = !demoToggle.checked;
mapView.setShowDensity(heatmapToggle.checked);
loadDemo();
// Try to center on the user's real location (non-blocking; demo shows meanwhile).
void initRealLocation();
