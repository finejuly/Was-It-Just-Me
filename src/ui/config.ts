// UI-level constants for the "Was It Just Me?" demo app. Kept separate from the
// pure core so the privacy/sim modules stay free of any UI concerns.

import type { LatLng } from "../sim/simulator.ts";

/** A calm, generic demo neighborhood center (downtown-ish, no real address). */
export const DEMO_CENTER: LatLng = { lat: 37.7749, lng: -122.4194 };

/** Deterministic seed so the staged demo is reproducible run to run. */
export const DEMO_SEED = 20260613;

/** Initial map zoom. */
export const INITIAL_ZOOM = 14;

/**
 * Hard cap on zoom. The privacy bucket (geohash precision 6 ≈ ~1.2km cell) is
 * the finest real resolution; we must not let the user zoom in far enough to
 * imply we know anything finer than the bucket. ~16 keeps a cell comfortably
 * larger than a few screen pixels.
 */
export const MAX_ZOOM = 16;

export const MIN_ZOOM = 10;

/**
 * The live "rolling window" width in ms used when not scrubbing. Matches the
 * privacy core's default window (60s) so live = the most recent window of
 * coarsened time. Demo timelines are stamped across an hour, so a live view
 * spanning a few windows reads better on stage; we widen it here.
 */
export const LIVE_WINDOW_MS = 10 * 60 * 1000;
