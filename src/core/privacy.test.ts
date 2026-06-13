import { test } from "node:test";
import assert from "node:assert/strict";
import { encode, decodeBounds } from "./geohash.ts";
import {
  transformSignal,
  visibleCells,
  DEFAULT_CONFIG,
  type SignalRecord,
  type Rng,
} from "./privacy.ts";

// Deterministic RNG cycling through given values (for reproducible tests).
function seededRng(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length];
}

const EXPECTED_KEYS = ["cell", "id", "jittered_lat", "jittered_lng", "source", "t"];

test("geohash encode matches a known reference vector", () => {
  // Classic reference: (57.64911, 10.40744) => "u4pruydqqvj"
  assert.equal(encode(57.64911, 10.40744, 6), "u4pruy");
});

test("AC: record has exactly the PRD fields — no raw/identity leakage", () => {
  const r = transformSignal(37.5665, 126.978, 1_700_000_123_456, "real");
  assert.deepEqual(Object.keys(r).sort(), EXPECTED_KEYS);
  // No raw coordinate or identity field present under any common name.
  for (const forbidden of ["rawLat", "rawLng", "lat", "lng", "userId", "deviceId"]) {
    assert.equal(forbidden in (r as Record<string, unknown>), false, `leaked ${forbidden}`);
  }
});

test("AC: cell equals the geohash of the raw coordinate at configured precision", () => {
  const r = transformSignal(37.5665, 126.978, 0, "real");
  assert.equal(r.cell, encode(37.5665, 126.978, DEFAULT_CONFIG.bucketPrecision));
});

test("AC: jittered coords decode back to the same cell (within-cell invariant)", () => {
  // Property check over many random inputs and rng draws.
  for (let i = 0; i < 500; i++) {
    const lat = (Math.random() * 140) - 70; // avoid extreme poles for fp safety
    const lng = (Math.random() * 360) - 180;
    const r = transformSignal(lat, lng, 0, "real");
    assert.equal(
      encode(r.jittered_lat, r.jittered_lng, DEFAULT_CONFIG.bucketPrecision),
      r.cell,
      `jittered point escaped its cell for (${lat},${lng})`,
    );
  }
});

test("AC: jittered coords never exactly equal the raw input", () => {
  for (let i = 0; i < 500; i++) {
    const lat = (Math.random() * 140) - 70;
    const lng = (Math.random() * 360) - 180;
    const r = transformSignal(lat, lng, 0, "real");
    assert.notEqual(r.jittered_lat, lat);
    assert.notEqual(r.jittered_lng, lng);
  }
});

test("AC: per-signal randomization — same raw input yields different jitter", () => {
  const a = transformSignal(37.5665, 126.978, 0, "real");
  const b = transformSignal(37.5665, 126.978, 0, "real");
  assert.equal(a.cell, b.cell); // same cell...
  assert.notEqual(`${a.jittered_lat},${a.jittered_lng}`, `${b.jittered_lat},${b.jittered_lng}`);
});

test("AC: timestamp is coarsened to the window; sub-window precision discarded", () => {
  const ts = 1_700_000_123_456;
  const r = transformSignal(0, 0, ts, "real");
  assert.equal(r.t % DEFAULT_CONFIG.windowMs, 0);
  assert.ok(r.t <= ts && ts < r.t + DEFAULT_CONFIG.windowMs);
  // Two captures in the same window collapse to the same t.
  const r2 = transformSignal(0, 0, ts + 5_000, "real");
  assert.equal(r.t, r2.t);
});

test("AC: rng is injectable and deterministic", () => {
  const rng = seededRng([0.25, 0.75]);
  const r = transformSignal(37.5665, 126.978, 0, "real", {
    rng,
    newId: () => "fixed-id",
  });
  const b = decodeBounds(r.cell);
  assert.equal(r.id, "fixed-id");
  assert.equal(r.jittered_lat, b.latMin + 0.25 * (b.latMax - b.latMin));
  assert.equal(r.jittered_lng, b.lngMin + 0.75 * (b.lngMax - b.lngMin));
});

test("AC: opaque id is unique per signal", () => {
  const ids = new Set<string>();
  for (let i = 0; i < 100; i++) ids.add(transformSignal(0, 0, 0, "real").id);
  assert.equal(ids.size, 100);
});

test("AC: sparse-area suppression hides cells below k-anonymity threshold", () => {
  const mk = (cell: string): SignalRecord => ({
    id: "x", cell, jittered_lat: 0, jittered_lng: 0, t: 0, source: "demo",
  });
  const records = [mk("aaaaaa"), mk("aaaaaa"), mk("bbbbbb"), mk("bbbbbb"), mk("bbbbbb")];
  const visible = visibleCells(records, 3);
  assert.deepEqual(visible, [{ cell: "bbbbbb", count: 3 }]);
  // Lowering the threshold (e.g. demo mode) reveals more.
  assert.equal(visibleCells(records, 2).length, 2);
});

test("source flag is preserved (demo data must stay separable from real)", () => {
  assert.equal(transformSignal(0, 0, 0, "demo").source, "demo");
  assert.equal(transformSignal(0, 0, 0, "real").source, "real");
});
