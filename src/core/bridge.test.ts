// Tests for the JavaScriptCore bridge surface (TASK-202606131313, increment A).
//
// The native macOS sender (Swift) talks to the privacy core ONLY through
// `WIJM.transformSignal` with an injected rng + id (JSC has no Web Crypto). These
// tests pin that exact contract from JS so a regression in the bridge is caught by
// `npm test` even when the Swift toolchain is unavailable. They assert the SAME
// privacy invariants as privacy.test.ts, but through the bridge's injected-source
// signature — i.e. the precise call Swift makes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { encode, decodeBounds } from "./geohash.ts";
import { WIJM } from "./bridge.ts";
import { DEFAULT_CONFIG } from "./privacy.ts";

const EXPECTED_KEYS = ["cell", "id", "jittered_lat", "jittered_lng", "source", "t"];

// Mirror Swift's injected sources: a uniform-[0,1) fn and an opaque id fn.
function counterId(): () => string {
  let n = 0;
  return () => `swift-uuid-${n++}`;
}

test("bridge: WIJM exposes transformSignal + visibleCells", () => {
  assert.equal(typeof WIJM.transformSignal, "function");
  assert.equal(typeof WIJM.visibleCells, "function");
});

test("bridge: attaches WIJM onto globalThis (the symbol Swift reads)", () => {
  assert.equal((globalThis as unknown as { WIJM?: unknown }).WIJM, WIJM);
});

test("bridge: record has exactly the six allowed fields — no raw/identity leak", () => {
  const r = WIJM.transformSignal(37.5665, 126.978, 1_700_000_123_456, "real", Math.random, counterId());
  assert.deepEqual(Object.keys(r).sort(), EXPECTED_KEYS);
  for (const forbidden of ["rawLat", "rawLng", "lat", "lng", "userId", "deviceId"]) {
    assert.equal(forbidden in (r as Record<string, unknown>), false, `leaked ${forbidden}`);
  }
});

test("bridge: injected rng drives jitter via the exact core formula", () => {
  // Cycle [0.25, 0.75] exactly like the Swift deterministic parity test.
  const seq = [0.25, 0.75];
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const r = WIJM.transformSignal(37.5665, 126.978, 0, "real", rng, () => "fixed-id");
  const b = decodeBounds(r.cell);
  assert.equal(r.id, "fixed-id");
  assert.equal(r.jittered_lat, b.latMin + 0.25 * (b.latMax - b.latMin));
  assert.equal(r.jittered_lng, b.lngMin + 0.75 * (b.lngMax - b.lngMin));
});

test("bridge: jittered point stays within its cell (bounded jitter)", () => {
  for (let k = 0; k < 300; k++) {
    const lat = Math.random() * 140 - 70;
    const lng = Math.random() * 360 - 180;
    const r = WIJM.transformSignal(lat, lng, 0, "real", Math.random, counterId());
    assert.equal(
      encode(r.jittered_lat, r.jittered_lng, DEFAULT_CONFIG.bucketPrecision),
      r.cell,
      `jittered point escaped its cell for (${lat},${lng})`,
    );
  }
});

test("bridge: per-signal randomization — same input scatters across the cell", () => {
  const id = counterId();
  const a = WIJM.transformSignal(37.5665, 126.978, 0, "real", Math.random, id);
  const b = WIJM.transformSignal(37.5665, 126.978, 0, "real", Math.random, id);
  assert.equal(a.cell, b.cell);
  assert.notEqual(`${a.jittered_lat},${a.jittered_lng}`, `${b.jittered_lat},${b.jittered_lng}`);
});

test("bridge: source flag round-trips (demo data stays separable)", () => {
  assert.equal(WIJM.transformSignal(0, 0, 0, "demo", Math.random, () => "x").source, "demo");
  assert.equal(WIJM.transformSignal(0, 0, 0, "real", Math.random, () => "y").source, "real");
});
