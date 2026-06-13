// "Was It Just Me?" — app entry. Wires the tested pure cores (privacy, aggregate,
// simulator) to a Leaflet map, a time scrubber, and the one-gesture signal send.
//
// Privacy posture of this file: it only ever touches privacy-safe SignalRecords
// and densityGrid cell centers. There are no raw coordinates anywhere in the
// runtime — the simulator and triggerSignal both route through transformSignal,
// which is the only place a raw point ever briefly exists, and it never escapes.

import "leaflet/dist/leaflet.css";
import { triggerSignal, generateScenario } from "./sim/simulator.ts";
import { inWindow, timeBounds } from "./core/aggregate.ts";
import type { SignalRecord } from "./core/privacy.ts";
import { SignalStore } from "./ui/store.ts";
import { MapView } from "./ui/mapView.ts";
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
const timeMode = $<HTMLSpanElement>("time-mode");
const timeReadout = $<HTMLSpanElement>("time-readout");
const liveBtn = $<HTMLButtonElement>("live-btn");
const noticeBtn = $<HTMLButtonElement>("notice-btn");
const confirmEl = $<HTMLDivElement>("confirm");
const demoToggle = $<HTMLInputElement>("demo-toggle");
const heatmapToggle = $<HTMLInputElement>("heatmap-toggle");

// --- View state ----------------------------------------------------------
// `live` true => follow the newest window. `live` false => show the window at
// the scrubber's position (historical replay). The scrubber's integer value is
// an offset (in LIVE_WINDOW_MS steps) from the timeline's start.
let live = true;

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

/** Compute the [fromT, toT) window currently being viewed. */
function currentWindow(records: readonly SignalRecord[]): { fromT: number; toT: number } | null {
  const bounds = timeBounds(records);
  if (bounds === null) return null;
  // Scrubber spans [minT, maxT] in LIVE_WINDOW_MS steps.
  const span = Math.max(0, bounds.maxT - bounds.minT);
  const steps = Math.max(1, Math.ceil(span / LIVE_WINDOW_MS));
  scrubber.max = String(steps);

  if (live) {
    scrubber.value = String(steps);
    const toT = bounds.maxT + 1; // inclusive of the newest window's records
    return { fromT: toT - LIVE_WINDOW_MS, toT };
  }

  const offset = Number(scrubber.value);
  const fromT = bounds.minT + offset * LIVE_WINDOW_MS;
  return { fromT, toT: fromT + LIVE_WINDOW_MS };
}

function refresh(records: readonly SignalRecord[]): void {
  const win = currentWindow(records);
  if (win === null) {
    mapView.render([]);
    timeReadout.textContent = "No signals yet";
    return;
  }
  const visible = inWindow(records, win.fromT, win.toT);
  mapView.render(visible);

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
  // Date.now() is fine in the browser. triggerSignal routes through the privacy
  // transform, so the added record is already jittered + bucketed + coarsened.
  const record = triggerSignal(DEMO_CENTER, Date.now());
  store.add(record);
  live = true; // jump back to live so the new signal is visible
  showConfirm("Thanks — your signal joined the others nearby.");
}

// --- Wiring --------------------------------------------------------------
store.subscribe(refresh);

scrubber.addEventListener("input", () => {
  live = Number(scrubber.value) >= Number(scrubber.max);
  refresh(store.all());
});

liveBtn.addEventListener("click", () => {
  live = true;
  refresh(store.all());
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

demoToggle.addEventListener("change", () => {
  if (demoToggle.checked) {
    loadDemo();
    showConfirm("Demo scenario loaded.");
  } else {
    // Leaving demo mode clears the staged scenario; only live-sent signals
    // (source "demo" from triggerSignal, but operator-fired) would remain. For a
    // clean slate we empty the set so the map reflects real send activity only.
    store.set([]);
    live = true;
    showConfirm("Demo cleared — send a signal to see it appear.");
  }
});

// --- Boot ----------------------------------------------------------------
mapView.setShowDensity(heatmapToggle.checked);
loadDemo();
