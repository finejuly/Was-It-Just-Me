// Time-window + heatmap-density aggregation for "Was It Just Me?".
//
// This is the data foundation for the live and historical (scrubbable) views
// and for the heatmap. It operates ONLY on already-privacy-safe SignalRecords
// produced by the privacy core: the coarsened window `t` and the geohash `cell`
// are the finest resolution that exists here. This module never reconstructs,
// interpolates, or otherwise invents precision finer than its inputs carry —
// so historical replay reveals no more than the live view did.
//
// Privacy invariants upheld here (see PRD "Time & history behavior", "Map
// behavior", "Privacy rules"):
//   - Density is exposed per cell, never per record/sender.
//   - k-anonymity: a cell is only emitted once it holds >= kAnon records in the
//     window under consideration. This module composes the privacy core's
//     `visibleCells` rather than re-deriving the rule, so the threshold can
//     never silently drift below the privacy core's guarantee.
//   - Cell centers come from `decodeBounds` (the public cell geometry), not from
//     any per-signal jittered coordinate, so a lone sender stays unisolatable.
//
// Pure module: no UI, no DOM, no network, no fs, no platform/location APIs.
// Only depends on the sibling pure cores and (in tests) node:test.

import { decodeBounds } from "./geohash.ts";
import {
  visibleCells,
  DEFAULT_CONFIG,
  type SignalRecord,
} from "./privacy.ts";

/**
 * Filter records to a half-open time window `[fromT, toT)`.
 *
 * The end is EXCLUSIVE by design: windows produced by the privacy transform are
 * floored to multiples of `windowMs`, so half-open `[from, to)` lets adjacent
 * windows tile a timeline with no double-counting and no gaps (a record at
 * exactly `toT` belongs to the next window, not this one).
 *
 * Inputs are not mutated; a new array is returned (stable input order kept).
 */
export function inWindow(
  records: readonly SignalRecord[],
  fromT: number,
  toT: number,
): SignalRecord[] {
  return records.filter((r) => r.t >= fromT && r.t < toT);
}

/**
 * Min and max coarsened timestamp across the records, for sizing a scrubber /
 * timeline. Returns `null` for empty input (there is no range to scrub).
 * The values are themselves window-floored `t`s, so no finer precision leaks.
 */
export function timeBounds(
  records: readonly SignalRecord[],
): { minT: number; maxT: number } | null {
  if (records.length === 0) return null;
  let minT = records[0].t;
  let maxT = records[0].t;
  for (const r of records) {
    if (r.t < minT) minT = r.t;
    if (r.t > maxT) maxT = r.t;
  }
  return { minT, maxT };
}

/** One heatmap-ready cell: its density and the center of its (public) geometry. */
export interface DensityCell {
  cell: string;
  count: number;
  centerLat: number;
  centerLng: number;
}

export interface DensityGridOptions {
  /** k-anonymity threshold; defaults to the privacy core's DEFAULT_CONFIG.kAnon. */
  kAnon?: number;
}

/**
 * Aggregate per-cell signal density for the heatmap.
 *
 * Counting and the sub-k suppression are delegated to the privacy core's
 * `visibleCells`, so this can NEVER expose a cell below the k-anonymity
 * threshold. Each surviving cell is decorated with the geometric center of its
 * geohash bounds (from `decodeBounds`) — derived purely from the cell id, never
 * from any individual record's jittered point.
 *
 * Pass records already narrowed to the window of interest (e.g. via `inWindow`);
 * the k-anonymity check then applies to that window, matching the live view.
 */
export function densityGrid(
  records: readonly SignalRecord[],
  opts: DensityGridOptions = {},
): DensityCell[] {
  const kAnon = opts.kAnon ?? DEFAULT_CONFIG.kAnon;
  return visibleCells(records, kAnon).map(({ cell, count }) => {
    const b = decodeBounds(cell);
    return {
      cell,
      count,
      centerLat: (b.latMin + b.latMax) / 2,
      centerLng: (b.lngMin + b.lngMax) / 2,
    };
  });
}

/**
 * Per-window signal counts for an activity strip / sparkline under the scrubber.
 *
 * Returns an array of length `steps`, where entry `i` is the number of records whose
 * coarsened `t` falls in the half-open frame `[fromT + i*windowMs, fromT + (i+1)*windowMs)`.
 * The grid (`fromT`, `windowMs`, `steps`) is supplied by the caller so the bars line up
 * 1:1 with the scrubber's own steps — the UI passes the exact same window math it scrubs
 * over, guaranteeing each bar maps to one scrubber position.
 *
 * Privacy: this exposes ONLY per-window aggregate counts at the existing coarsened-`t`
 * resolution (the same the live view already shows). It composes the tested `inWindow`
 * filter rather than re-deriving binning, so it can never reveal finer-than-window time
 * precision, and it never reads or returns any coordinate or per-sender field.
 *
 * Pure: no UI, no DOM, no platform APIs. Throws on a non-positive `windowMs` (matches
 * `windowsOf`). `steps <= 0` yields an empty array.
 */
export function windowCounts(
  records: readonly SignalRecord[],
  fromT: number,
  windowMs: number,
  steps: number,
): number[] {
  if (windowMs <= 0) throw new Error("windowMs must be > 0");
  const n = Math.max(0, Math.floor(steps));
  const counts = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const start = fromT + i * windowMs;
    counts[i] = inWindow(records, start, start + windowMs).length;
  }
  return counts;
}

/** One frame of a scrubbable timeline: a window and the records falling in it. */
export interface TimelineFrame {
  fromT: number;
  toT: number;
  records: SignalRecord[];
}

/**
 * Bucket records into consecutive `windowMs`-wide frames spanning their time
 * range, for a scrubber to step through. Frame boundaries are aligned to
 * multiples of `windowMs` (the same grid the privacy transform floors to), so
 * each record lands in exactly one frame and no frame reveals sub-window time
 * precision. Empty input yields no frames.
 *
 * Frames are contiguous across the whole range, including any that are empty,
 * so a scrubber sees a steady timeline rather than skipping quiet windows.
 */
export function windowsOf(
  records: readonly SignalRecord[],
  windowMs: number = DEFAULT_CONFIG.windowMs,
): TimelineFrame[] {
  if (windowMs <= 0) throw new Error("windowMs must be > 0");
  const bounds = timeBounds(records);
  if (bounds === null) return [];

  const start = Math.floor(bounds.minT / windowMs) * windowMs;
  // End is exclusive: the frame containing maxT runs [floor(maxT), +windowMs).
  const end = Math.floor(bounds.maxT / windowMs) * windowMs + windowMs;

  const frames: TimelineFrame[] = [];
  for (let fromT = start; fromT < end; fromT += windowMs) {
    const toT = fromT + windowMs;
    frames.push({ fromT, toT, records: inWindow(records, fromT, toT) });
  }
  return frames;
}
