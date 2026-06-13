import { test } from "node:test";
import assert from "node:assert/strict";
import { encode, decodeBounds } from "./geohash.ts";
import { DEFAULT_CONFIG, type SignalRecord } from "./privacy.ts";
import {
  inWindow,
  timeBounds,
  densityGrid,
  windowsOf,
  windowCounts,
} from "./aggregate.ts";

// Build a minimal record. Only `cell` and `t` matter for aggregation; the
// jittered coords are deliberately set to sentinel values so any test that
// accidentally read them (instead of the cell geometry) would be obvious.
function mk(cell: string, t: number, id = `${cell}@${t}`): SignalRecord {
  return {
    id,
    cell,
    jittered_lat: 999, // sentinel: must never appear in any output
    jittered_lng: 999,
    t,
    source: "demo",
  };
}

// A geohash for a real coordinate, so decodeBounds yields a meaningful cell.
const SEOUL = encode(37.5665, 126.978, DEFAULT_CONFIG.bucketPrecision);
const NYC = encode(40.7128, -74.006, DEFAULT_CONFIG.bucketPrecision);

// ---------------------------------------------------------------------------
// inWindow: exact half-open [fromT, toT) membership, boundaries tested.
// ---------------------------------------------------------------------------

test("inWindow returns exactly the records inside [fromT, toT)", () => {
  const records = [mk(SEOUL, 0), mk(SEOUL, 100), mk(SEOUL, 200), mk(SEOUL, 300)];
  const got = inWindow(records, 100, 300);
  assert.deepEqual(
    got.map((r) => r.t),
    [100, 200],
    "should include t=100 (start, inclusive) and t=200, exclude t=300 (end)",
  );
});

test("inWindow start is inclusive, end is exclusive (boundary records)", () => {
  const atStart = mk(SEOUL, 1000);
  const atEnd = mk(SEOUL, 2000);
  const inside = mk(SEOUL, 1500);
  const records = [atStart, atEnd, inside];

  const got = inWindow(records, 1000, 2000);
  const ids = got.map((r) => r.id);
  assert.ok(ids.includes(atStart.id), "record exactly at fromT must be included");
  assert.ok(!ids.includes(atEnd.id), "record exactly at toT must be excluded");
  assert.ok(ids.includes(inside.id));
  assert.equal(got.length, 2);
});

test("inWindow excludes records outside on both sides", () => {
  const records = [mk(SEOUL, -50), mk(SEOUL, 50), mk(SEOUL, 5000)];
  const got = inWindow(records, 0, 1000);
  assert.deepEqual(got.map((r) => r.t), [50]);
});

test("inWindow returns empty (not error) for no matches and preserves input", () => {
  const records = [mk(SEOUL, 10), mk(SEOUL, 20)];
  const got = inWindow(records, 1000, 2000);
  assert.deepEqual(got, []);
  // Input not mutated.
  assert.equal(records.length, 2);
});

// ---------------------------------------------------------------------------
// timeBounds: correct min/max, null for empty.
// ---------------------------------------------------------------------------

test("timeBounds returns correct min and max", () => {
  const records = [mk(SEOUL, 300), mk(SEOUL, 100), mk(SEOUL, 700), mk(SEOUL, 200)];
  assert.deepEqual(timeBounds(records), { minT: 100, maxT: 700 });
});

test("timeBounds returns null for empty input", () => {
  assert.equal(timeBounds([]), null);
});

test("timeBounds handles a single record (min === max)", () => {
  assert.deepEqual(timeBounds([mk(SEOUL, 42)]), { minT: 42, maxT: 42 });
});

// ---------------------------------------------------------------------------
// densityGrid: per-cell counts + k-anonymity suppression.
// ---------------------------------------------------------------------------

test("densityGrid counts records per cell correctly", () => {
  const records = [
    mk(SEOUL, 0), mk(SEOUL, 0), mk(SEOUL, 0), // 3 in SEOUL
    mk(NYC, 0), mk(NYC, 0), mk(NYC, 0), mk(NYC, 0), // 4 in NYC
  ];
  const grid = densityGrid(records, { kAnon: 1 });
  const byCell = new Map(grid.map((c) => [c.cell, c.count]));
  assert.equal(byCell.get(SEOUL), 3);
  assert.equal(byCell.get(NYC), 4);
  assert.equal(grid.length, 2);
});

test("densityGrid suppresses cells below kAnon (k-anonymity preserved)", () => {
  const records = [
    mk(SEOUL, 0), mk(SEOUL, 0), // 2 — below default k (3): must be hidden
    mk(NYC, 0), mk(NYC, 0), mk(NYC, 0), // 3 — meets default k: visible
  ];
  const grid = densityGrid(records); // default kAnon = 3
  assert.equal(DEFAULT_CONFIG.kAnon, 3);
  assert.deepEqual(grid.map((c) => c.cell), [NYC]);
  assert.equal(grid[0].count, 3);
});

test("densityGrid never exposes a lone sender, regardless of how many lone cells", () => {
  // Many distinct cells each with a single record — classic isolation attack.
  const records = Array.from({ length: 20 }, (_, i) =>
    mk(encode(i, i, DEFAULT_CONFIG.bucketPrecision), 0, `lone-${i}`),
  );
  const grid = densityGrid(records); // default k = 3
  assert.deepEqual(grid, [], "no cell with < k records may surface");
});

test("densityGrid respects a configurable (lower) kAnon for demo mode", () => {
  const records = [mk(SEOUL, 0), mk(SEOUL, 0), mk(NYC, 0)];
  const k2 = densityGrid(records, { kAnon: 2 });
  assert.deepEqual(k2.map((c) => c.cell), [SEOUL]);
  // k=1 reveals everything.
  assert.equal(densityGrid(records, { kAnon: 1 }).length, 2);
});

test("densityGrid is empty for empty input", () => {
  assert.deepEqual(densityGrid([]), []);
});

// ---------------------------------------------------------------------------
// densityGrid cell centers lie within decodeBounds, and use cell geometry only.
// ---------------------------------------------------------------------------

test("densityGrid centers lie within the cell bounds from decodeBounds", () => {
  const records = [
    mk(SEOUL, 0), mk(SEOUL, 0), mk(SEOUL, 0),
    mk(NYC, 0), mk(NYC, 0), mk(NYC, 0),
  ];
  const grid = densityGrid(records, { kAnon: 3 });
  assert.equal(grid.length, 2);
  for (const c of grid) {
    const b = decodeBounds(c.cell);
    assert.ok(c.centerLat >= b.latMin && c.centerLat <= b.latMax, `lat in bounds for ${c.cell}`);
    assert.ok(c.centerLng >= b.lngMin && c.centerLng <= b.lngMax, `lng in bounds for ${c.cell}`);
    // Center is the exact midpoint of the bounds.
    assert.equal(c.centerLat, (b.latMin + b.latMax) / 2);
    assert.equal(c.centerLng, (b.lngMin + b.lngMax) / 2);
    // Re-encoding the center stays in the same cell.
    assert.equal(encode(c.centerLat, c.centerLng, c.cell.length), c.cell);
  }
});

test("densityGrid center ignores jittered per-record coords (uses cell geometry)", () => {
  // Sentinel jitter is 999/999 — far outside any real cell. If the center ever
  // reflected per-record coords, it would be near 999; it must not be.
  const records = [mk(SEOUL, 0), mk(SEOUL, 0), mk(SEOUL, 0)];
  const [cell] = densityGrid(records, { kAnon: 1 });
  assert.notEqual(cell.centerLat, 999);
  assert.notEqual(cell.centerLng, 999);
  const b = decodeBounds(SEOUL);
  assert.ok(cell.centerLat >= b.latMin && cell.centerLat <= b.latMax);
});

// ---------------------------------------------------------------------------
// No finer precision than the input t/cell carry.
// ---------------------------------------------------------------------------

test("aggregation never produces precision finer than input cell length", () => {
  const records = [mk(SEOUL, 0), mk(SEOUL, 0), mk(SEOUL, 0)];
  const grid = densityGrid(records, { kAnon: 1 });
  for (const c of grid) {
    // Output cell id is exactly an input cell id — no extra geohash chars.
    assert.equal(c.cell, SEOUL);
    assert.equal(c.cell.length, DEFAULT_CONFIG.bucketPrecision);
  }
});

test("frame and bounds timestamps stay on the window grid — no sub-window precision", () => {
  const w = DEFAULT_CONFIG.windowMs;
  // Records already floored to the window grid (as the privacy transform emits).
  const records = [mk(SEOUL, 0), mk(SEOUL, 0), mk(NYC, 2 * w), mk(NYC, 2 * w)];
  const b = timeBounds(records)!;
  assert.equal(b.minT % w, 0);
  assert.equal(b.maxT % w, 0);
  for (const f of windowsOf(records, w)) {
    assert.equal(f.fromT % w, 0, "frame start on grid");
    assert.equal(f.toT % w, 0, "frame end on grid");
    assert.equal(f.toT - f.fromT, w, "frame is exactly one window wide");
  }
});

// ---------------------------------------------------------------------------
// windowsOf: contiguous frames, each record in exactly one frame.
// ---------------------------------------------------------------------------

test("windowsOf buckets a timeline into contiguous frames", () => {
  const w = 1000;
  const records = [
    mk(SEOUL, 0),      // frame 0: [0, 1000)
    mk(SEOUL, 500),    // frame 0
    mk(NYC, 2000),     // frame 2: [2000, 3000)
  ];
  const frames = windowsOf(records, w);
  // Range spans [0, 3000) => 3 contiguous frames, including the empty middle one.
  assert.equal(frames.length, 3);
  assert.deepEqual(frames.map((f) => [f.fromT, f.toT]), [
    [0, 1000],
    [1000, 2000],
    [2000, 3000],
  ]);
  assert.equal(frames[0].records.length, 2);
  assert.equal(frames[1].records.length, 0, "quiet window kept as empty frame");
  assert.equal(frames[2].records.length, 1);

  // Every record appears in exactly one frame.
  const total = frames.reduce((n, f) => n + f.records.length, 0);
  assert.equal(total, records.length);
});

test("windowsOf returns no frames for empty input and rejects non-positive window", () => {
  assert.deepEqual(windowsOf([], 1000), []);
  assert.throws(() => windowsOf([mk(SEOUL, 0)], 0), /windowMs must be > 0/);
});

test("windowsOf aligns frame boundaries to multiples of windowMs", () => {
  const w = 1000;
  // minT not aligned to the grid: 1500 floors to 1000.
  const records = [mk(SEOUL, 1500), mk(SEOUL, 1500)];
  const frames = windowsOf(records, w);
  assert.equal(frames[0].fromT, 1000);
  assert.equal(frames[0].toT, 2000);
  assert.equal(frames[0].records.length, 2);
});

// ---------------------------------------------------------------------------
// windowCounts: per-window counts on a caller-supplied grid (scrubber sparkline).
// ---------------------------------------------------------------------------

test("windowCounts returns per-window counts aligned to the supplied grid", () => {
  const w = 1000;
  // 3 in [0,1000), 0 in [1000,2000), 2 in [2000,3000).
  const records = [
    mk(SEOUL, 0),
    mk(SEOUL, 500),
    mk(SEOUL, 999),
    mk(SEOUL, 2000),
    mk(NYC, 2500),
  ];
  assert.deepEqual(windowCounts(records, 0, w, 3), [3, 0, 2]);
});

test("windowCounts honors the half-open [from,to) boundary (no double counting)", () => {
  const w = 1000;
  // A record exactly on a frame boundary belongs to the next frame only.
  const records = [mk(SEOUL, 1000)];
  assert.deepEqual(
    windowCounts(records, 0, w, 2),
    [0, 1],
    "t=1000 lands in [1000,2000), not in [0,1000)",
  );
  // And the per-window counts must sum to the records that fall in range.
  const sum = windowCounts(records, 0, w, 2).reduce((a, b) => a + b, 0);
  assert.equal(sum, 1);
});

test("windowCounts: empty input → all zeros; steps<=0 → empty array", () => {
  assert.deepEqual(windowCounts([], 0, 1000, 4), [0, 0, 0, 0]);
  assert.deepEqual(windowCounts([mk(SEOUL, 0)], 0, 1000, 0), []);
  assert.deepEqual(windowCounts([mk(SEOUL, 0)], 0, 1000, -3), []);
});

test("windowCounts ignores records outside the grid and rejects non-positive window", () => {
  const w = 1000;
  // Records before the grid start and after its end must not be counted.
  const records = [mk(SEOUL, -500), mk(SEOUL, 500), mk(SEOUL, 5000)];
  // Grid is [0,1000) , [1000,2000): only t=500 is in range, in the first frame.
  assert.deepEqual(windowCounts(records, 0, w, 2), [1, 0], "only t=500 is in [0,2000)");
  assert.throws(() => windowCounts(records, 0, 0, 2), /windowMs must be > 0/);
});
