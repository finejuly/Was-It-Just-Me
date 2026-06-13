// Tests for the pure demo-mode playback controller (src/sim/playback.ts).
// Verifies the deterministic stepping clock that auto-advances the scrubber on
// stage: clamping, speed scaling, sub-step carry, and end detection.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advancePlayback,
  BASE_STEPS_PER_SECOND,
  PLAYBACK_SPEEDS,
  type PlaybackSpeed,
} from "./playback.ts";

const SEC = 1000;

test("at 1x, advances ~BASE_STEPS_PER_SECOND steps per second", () => {
  const r = advancePlayback(0, 100, 1, 1 * SEC);
  assert.equal(r.step, BASE_STEPS_PER_SECOND);
  assert.equal(r.reachedEnd, false);
});

test("speed multiplies the advance rate (2x and 4x cover more steps)", () => {
  const oneX = advancePlayback(0, 100, 1, 4 * SEC).step;
  const twoX = advancePlayback(0, 100, 2, 4 * SEC).step;
  const fourX = advancePlayback(0, 100, 4, 4 * SEC).step;
  assert.equal(oneX, 4);
  assert.equal(twoX, 8);
  assert.equal(fourX, 16);
});

test("clamps at maxStep and reports reachedEnd", () => {
  const r = advancePlayback(5, 6, 4, 10 * SEC); // would overshoot
  assert.equal(r.step, 6);
  assert.equal(r.reachedEnd, true);
});

test("never moves backward and never below 0", () => {
  const r = advancePlayback(3, 10, 1, 0); // no time elapsed
  assert.equal(r.step, 3);
  const clampLow = advancePlayback(-5, 10, 1, 0);
  assert.equal(clampLow.step, 0);
});

test("clamps a current value above maxStep down into range", () => {
  const r = advancePlayback(99, 6, 1, 0);
  assert.equal(r.step, 6);
  assert.equal(r.reachedEnd, true);
});

test("maxStep of 0 is immediately at the end (single-frame timeline)", () => {
  const r = advancePlayback(0, 0, 1, 100 * SEC);
  assert.equal(r.step, 0);
  assert.equal(r.reachedEnd, true);
});

test("sub-step carry accumulates across small ticks without rounding loss", () => {
  // At 1x, a step is 1000ms. Four 300ms ticks = 1200ms => exactly one whole step
  // with 200ms carried, then continuing accumulates correctly.
  let step = 0;
  let carry = 0;
  let totalSteps = 0;
  for (let i = 0; i < 4; i++) {
    const r = advancePlayback(step, 100, 1, 300, carry);
    totalSteps += r.step - step;
    step = r.step;
    carry = r.carryMs;
  }
  assert.equal(totalSteps, 1); // 1200ms / 1000ms-per-step = 1 whole step
  assert.ok(Math.abs(carry - 200) < 1e-9);
  // One more 800ms tick (carry 200 + 800 = 1000ms) yields the next step.
  const r = advancePlayback(step, 100, 1, 800, carry);
  assert.equal(r.step - step, 1);
});

test("PLAYBACK_SPEEDS are positive multipliers and typed", () => {
  for (const s of PLAYBACK_SPEEDS) {
    const speed: PlaybackSpeed = s;
    assert.ok(speed > 0);
  }
});
