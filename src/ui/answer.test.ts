// Tests for the pure headline-answer copy (src/ui/answer.ts).
// Verifies the count→message mapping, live/history reframing, and that the copy
// only ever reflects the aggregate count (never leaks anything per-sender).

import { test } from "node:test";
import assert from "node:assert/strict";
import { answerFor } from "./answer.ts";

test("zero signals → quiet 'empty' tone, reframed for live vs history", () => {
  const liveA = answerFor(0, true);
  assert.equal(liveA.tone, "empty");
  assert.match(liveA.text, /nobody/i);

  const histA = answerFor(0, false);
  assert.equal(histA.tone, "empty");
  assert.match(histA.text, /window/i);
});

test("one signal → 'alone' tone ('might just be you' when live)", () => {
  const a = answerFor(1, true);
  assert.equal(a.tone, "alone");
  assert.match(a.text, /just be you/i);

  assert.equal(answerFor(1, false).tone, "alone");
});

test("two-plus signals → 'together' tone and includes the count", () => {
  const a = answerFor(5, true);
  assert.equal(a.tone, "together");
  assert.match(a.text, /wasn.t just you/i);
  assert.ok(a.text.includes("5"), "live copy includes the aggregate count");

  const h = answerFor(5, false);
  assert.equal(h.tone, "together");
  assert.ok(h.text.includes("5"), "history copy includes the aggregate count");
});

test("non-integer / negative / NaN counts never produce 'NaN' or fractions", () => {
  for (const bad of [-3, NaN, Infinity, -Infinity]) {
    const a = answerFor(bad, true);
    assert.equal(a.tone, "empty", `count=${bad} should be treated as empty`);
    assert.doesNotMatch(a.text, /NaN|Infinity/);
  }
  // Fractional counts floor to a whole number in the copy.
  const frac = answerFor(3.9, true);
  assert.equal(frac.tone, "together");
  assert.ok(frac.text.includes("3"), "3.9 floors to 3 in the message");
  assert.doesNotMatch(frac.text, /3\.9|3\.|\bNaN\b/);
});

test("copy carries no coordinate-like or per-sender data — only an aggregate count", () => {
  for (const n of [0, 1, 2, 42]) {
    for (const live of [true, false]) {
      const { text } = answerFor(n, live);
      // No decimal lat/lng-looking tokens, no ids.
      assert.doesNotMatch(text, /-?\d{1,3}\.\d{3,}/, "no coordinate-like decimals");
      assert.doesNotMatch(text, /\bid\b|sender|exact/i, "no per-sender wording");
    }
  }
});
