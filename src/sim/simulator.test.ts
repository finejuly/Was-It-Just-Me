import { test } from "node:test";
import assert from "node:assert/strict";
import { encode } from "../core/geohash.ts";
import { type SignalRecord } from "../core/privacy.ts";
import {
  mulberry32,
  generateScenario,
  triggerSignal,
  type LatLng,
} from "./simulator.ts";

const CENTER: LatLng = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall
const EXPECTED_KEYS = ["cell", "id", "jittered_lat", "jittered_lng", "source", "t"];

function isValidRecord(r: SignalRecord): boolean {
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.cell === "string" &&
    r.cell.length > 0 &&
    typeof r.jittered_lat === "number" &&
    Number.isFinite(r.jittered_lat) &&
    typeof r.jittered_lng === "number" &&
    Number.isFinite(r.jittered_lng) &&
    typeof r.t === "number" &&
    Number.isFinite(r.t) &&
    (r.source === "demo" || r.source === "real")
  );
}

// Great-circle-ish distance in meters (equirectangular approx is fine here).
function distMeters(a: LatLng, b: LatLng): number {
  const mPerDegLat = 111_320;
  const dLat = (a.lat - b.lat) * mPerDegLat;
  const dLng = (a.lng - b.lng) * mPerDegLat * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

test("mulberry32 is deterministic and returns floats in [0,1)", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 50; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1, `value out of range: ${x}`);
  }
  // Different seed diverges.
  const c = mulberry32(43);
  assert.notEqual(mulberry32(42)(), c());
});

test("determinism: same seed => identical scenario (deep equal)", () => {
  const opts = { seed: 7, center: CENTER, startT: 1_700_000_000_000 };
  assert.deepEqual(generateScenario(opts), generateScenario({ ...opts }));
});

test("determinism: different seed => different scenario", () => {
  const base = { center: CENTER, startT: 1_700_000_000_000 };
  const a = generateScenario({ ...base, seed: 1 });
  const b = generateScenario({ ...base, seed: 2 });
  assert.notDeepEqual(a, b);
});

test("every generated record has source 'demo'", () => {
  const records = generateScenario({ seed: 99, center: CENTER });
  assert.ok(records.length > 0);
  for (const r of records) assert.equal(r.source, "demo");
});

test("all records are valid SignalRecords with exactly the PRD fields", () => {
  const records = generateScenario({ seed: 5, center: CENTER });
  for (const r of records) {
    assert.ok(isValidRecord(r), `invalid record: ${JSON.stringify(r)}`);
    assert.deepEqual(Object.keys(r).sort(), EXPECTED_KEYS);
  }
});

test("counts honor nearbyCount + falseCount", () => {
  const records = generateScenario({
    seed: 11,
    center: CENTER,
    nearbyCount: 20,
    falseCount: 15,
  });
  assert.equal(records.length, 35);
});

test("nearby signals cluster around center; false signals scatter farther out", () => {
  const nearbyCount = 30;
  const falseCount = 30;
  const nearbyRadiusMeters = 250;
  const falseRadiusMeters = 8_000;
  // Note: records come back sorted by time, so we can't slice by index to
  // separate nearby vs false. Instead assert distributional properties.
  const records = generateScenario({
    seed: 3,
    center: CENTER,
    nearbyCount,
    falseCount,
    nearbyRadiusMeters,
    falseRadiusMeters,
  });

  const dists = records
    .map((r) => distMeters({ lat: r.jittered_lat, lng: r.jittered_lng }, CENTER))
    .sort((x, y) => x - y);

  // The closest `nearbyCount` jittered points should all be well within the
  // false radius (they form a tight cluster). Allow a small jitter margin from
  // the privacy transform's within-cell scatter (cell ~1.2km, so < ~1.5km).
  const clusterMargin = nearbyRadiusMeters + 1_500;
  for (let i = 0; i < nearbyCount; i++) {
    assert.ok(
      dists[i] < clusterMargin,
      `nearby cluster point too far: ${dists[i]}m >= ${clusterMargin}m`,
    );
  }

  // The farthest false signals should reach well beyond the nearby cluster,
  // proving a genuine wide scatter exists.
  const maxDist = dists[dists.length - 1];
  assert.ok(
    maxDist > clusterMargin,
    `expected scattered false signals beyond ${clusterMargin}m, max was ${maxDist}m`,
  );

  // The center's own cell should be among the produced cells (cluster lands on
  // or adjacent to it), confirming clustering by geohash prefix too.
  const centerCell = encode(CENTER.lat, CENTER.lng, 6);
  const prefix4 = centerCell.slice(0, 4);
  const sharingPrefix = records.filter((r) => r.cell.startsWith(prefix4)).length;
  assert.ok(
    sharingPrefix >= nearbyCount * 0.5,
    `expected many nearby cells to share the center geohash prefix ${prefix4}, got ${sharingPrefix}`,
  );
});

test("timestamps fall within [startT, startT + durationMs]", () => {
  const startT = 1_700_000_000_000;
  const durationMs = 2 * 60 * 60 * 1000;
  const records = generateScenario({
    seed: 17,
    center: CENTER,
    startT,
    durationMs,
    nearbyCount: 40,
    falseCount: 40,
  });
  for (const r of records) {
    // t is window-coarsened (floored), so it can sit at startT's window floor
    // but never exceed the requested end.
    assert.ok(r.t >= startT - 60_000, `t below range: ${r.t} < ${startT}`);
    assert.ok(r.t <= startT + durationMs, `t above range: ${r.t} > ${startT + durationMs}`);
  }
});

test("records are returned sorted ascending by timestamp (replayable timeline)", () => {
  const records = generateScenario({ seed: 21, center: CENTER, nearbyCount: 25, falseCount: 25 });
  for (let i = 1; i < records.length; i++) {
    assert.ok(records[i].t >= records[i - 1].t, "timeline not sorted by t");
  }
});

test("triggerSignal returns one valid demo SignalRecord (seeded)", () => {
  const rng = mulberry32(123);
  const r = triggerSignal(CENTER, 1_700_000_555_000, rng);
  assert.ok(isValidRecord(r));
  assert.equal(r.source, "demo");
  assert.deepEqual(Object.keys(r).sort(), EXPECTED_KEYS);
  // Fired near the center: within the cluster radius + cell jitter margin.
  const d = distMeters({ lat: r.jittered_lat, lng: r.jittered_lng }, CENTER);
  assert.ok(d < 250 + 1_500, `trigger landed too far: ${d}m`);
});

test("triggerSignal is deterministic for a given seeded rng (position)", () => {
  const r1 = triggerSignal(CENTER, 1_700_000_555_000, mulberry32(8));
  const r2 = triggerSignal(CENTER, 1_700_000_555_000, mulberry32(8));
  assert.equal(r1.cell, r2.cell);
  assert.equal(r1.jittered_lat, r2.jittered_lat);
  assert.equal(r1.jittered_lng, r2.jittered_lng);
  assert.equal(r1.t, r2.t);
});

test("triggerSignal works without an rng (live ad-hoc fire)", () => {
  const r = triggerSignal(CENTER, 1_700_000_555_000);
  assert.ok(isValidRecord(r));
  assert.equal(r.source, "demo");
});
