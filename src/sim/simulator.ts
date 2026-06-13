// Demo-mode signal simulator for "Was It Just Me?" (TASK-202606131232).
//
// Drives a believable live demo with no real users: a cluster of "nearby"
// signals appearing around a center point, scattered "false"/background signals
// farther out, a replayable historical timeline, and an operator hotkey to
// inject one signal "now". Every signal is source:"demo" so it stays separable
// from real data, and the whole thing is deterministic from a numeric seed so
// the stage demo is reproducible.
//
// Pure module: no UI, no DOM, no network, no fs, no LLM, no platform/location
// APIs. The only dependency is the privacy core, and ALL positions are routed
// through transformSignal so privacy rules (bucketing/jitter/coarsening) apply
// and raw positions are never emitted.

import { transformSignal, type SignalRecord, type Rng } from "../core/privacy.ts";

/**
 * Seedable RNG factory (mulberry32). Given a numeric seed it returns a pure Rng
 * producing a deterministic float sequence in [0, 1). Identical seeds yield
 * identical sequences, which is what makes the demo reproducible. This is the
 * ONLY randomness source the simulator uses in its deterministic paths — never
 * Math.random or the core CSPRNG default.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Geographic point. */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Meters per degree of latitude (roughly constant across the globe). */
const METERS_PER_DEG_LAT = 111_320;

/**
 * Draw a uniformly-distributed raw point within `radiusMeters` of `center`,
 * using the injected rng. Uniform over the disc (sqrt on the radius draw avoids
 * center clustering). Longitude scaling accounts for latitude convergence.
 */
function randomPointAround(center: LatLng, radiusMeters: number, rng: Rng): LatLng {
  const angle = rng() * 2 * Math.PI;
  const dist = Math.sqrt(rng()) * radiusMeters;
  const dLat = (dist * Math.cos(angle)) / METERS_PER_DEG_LAT;
  const cosLat = Math.cos((center.lat * Math.PI) / 180) || 1e-9;
  const dLng = (dist * Math.sin(angle)) / (METERS_PER_DEG_LAT * cosLat);
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

/** Options for {@link generateScenario}. All have demo-friendly defaults. */
export interface ScenarioOptions {
  /** Numeric seed driving the whole scenario deterministically. */
  seed: number;
  /** Center point the "nearby" cluster forms around. */
  center: LatLng;
  /** How many believable nearby signals to generate. */
  nearbyCount?: number;
  /** How many scattered false/background signals to generate. */
  falseCount?: number;
  /** Radius (meters) the nearby cluster spreads over. Tight by default. */
  nearbyRadiusMeters?: number;
  /** Radius (meters) the false/background signals scatter over. Wide. */
  falseRadiusMeters?: number;
  /** Timeline start timestamp (ms epoch). */
  startT?: number;
  /** Timeline duration (ms) signals are stamped across, from startT. */
  durationMs?: number;
}

const SCENARIO_DEFAULTS = {
  nearbyCount: 12,
  falseCount: 8,
  nearbyRadiusMeters: 250,
  falseRadiusMeters: 5_000,
  startT: 0,
  durationMs: 60 * 60 * 1000, // one hour
} as const;

/**
 * Generate a deterministic timeline of demo signals: a cluster of nearby
 * signals around `center` plus scattered false signals across a wider radius.
 * Each signal is stamped with a timestamp in [startT, startT + durationMs] and
 * routed through transformSignal(..., "demo", { rng }) so privacy rules apply.
 *
 * Records are returned sorted ascending by timestamp so the timeline can be
 * replayed in order. Same seed => identical output.
 */
export function generateScenario(opts: ScenarioOptions): SignalRecord[] {
  const o = { ...SCENARIO_DEFAULTS, ...opts };
  const rng = mulberry32(o.seed);

  // Deterministic, unlinkable-looking ids derived from the same seeded stream.
  let idCounter = 0;
  const newId = () => `demo-${o.seed}-${idCounter++}`;

  const records: SignalRecord[] = [];

  const emit = (radiusMeters: number) => {
    const p = randomPointAround(o.center, radiusMeters, rng);
    const ts = o.startT + Math.floor(rng() * (o.durationMs + 1));
    records.push(transformSignal(p.lat, p.lng, ts, "demo", { rng, newId }));
  };

  for (let i = 0; i < o.nearbyCount; i++) emit(o.nearbyRadiusMeters);
  for (let i = 0; i < o.falseCount; i++) emit(o.falseRadiusMeters);

  records.sort((a, b) => a.t - b.t);
  return records;
}

/**
 * Operator hotkey: fire a single "I noticed something" demo signal near the
 * center at the given moment. Pass a seeded rng for deterministic output; if
 * omitted, transformSignal's default (CSPRNG) is used for an ad-hoc live fire.
 */
export function triggerSignal(
  center: LatLng,
  tsMillis: number,
  rng?: Rng,
  nearbyRadiusMeters: number = SCENARIO_DEFAULTS.nearbyRadiusMeters,
): SignalRecord {
  // Without a seeded rng we cannot derive a deterministic raw point; fall back
  // to the center itself (still jittered within its cell by transformSignal).
  const p = rng
    ? randomPointAround(center, nearbyRadiusMeters, rng)
    : { lat: center.lat, lng: center.lng };
  return transformSignal(p.lat, p.lng, tsMillis, "demo", rng ? { rng } : {});
}
