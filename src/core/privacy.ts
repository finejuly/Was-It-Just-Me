// Privacy core for "Was It Just Me?" — turns a raw capture location into a
// privacy-safe signal record that can never be reversed to the sender's true
// location, plus the display-time sparse-area suppression rule.
//
// Privacy invariants (see TASK-202606131231 / PRD "Privacy rules"):
//   1. Raw lat/lng, identity, and exact timestamp are never stored or returned.
//   2. Bucketing snaps to a coarse geohash cell (many plausible origins per cell).
//   3. Jitter is a UNIFORM-random point WITHIN the cell, drawn independently per
//      signal — never center-biased (would leak the center) and never a fixed
//      offset (could be subtracted out). Repeated signals from one true location
//      scatter across the whole cell, defeating triangulation.
//   4. Timestamps are coarsened to a window; sub-window precision is discarded.
//   5. A cell is only shown once it holds >= K_ANON records in a window.
//
// Pure module: no UI, no network, no platform/location APIs, no LLM.

import { encode, decodeBounds } from "./geohash.ts";

export type SignalSource = "real" | "demo";

/** The ONLY shape persisted/transmitted. No raw inputs, no identity. */
export interface SignalRecord {
  id: string;
  cell: string;
  jittered_lat: number;
  jittered_lng: number;
  t: number;
  source: SignalSource;
}

export interface PrivacyConfig {
  /** Geohash length. 6 ≈ ~1.2km × 0.6km cell. Larger = finer = less private. */
  bucketPrecision: number;
  /** Timestamp coarsening window in ms. */
  windowMs: number;
  /** k-anonymity threshold: min records in a cell+window before it is shown. */
  kAnon: number;
}

export const DEFAULT_CONFIG: PrivacyConfig = {
  bucketPrecision: 6,
  windowMs: 60_000,
  kAnon: 3,
};

/** RNG returning a float in [0, 1). Injectable for deterministic tests. */
export type Rng = () => number;

/** Default RNG backed by a CSPRNG (Web Crypto, available in browser and Node). */
export const defaultRng: Rng = () => {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
};

export interface TransformOptions {
  config?: Partial<PrivacyConfig>;
  rng?: Rng;
  /** Opaque id generator; default is a random UUID (unlinkable). */
  newId?: () => string;
}

/**
 * Transform a raw capture into a privacy-safe SignalRecord.
 * The raw coordinates and exact timestamp do not survive this call.
 */
export function transformSignal(
  rawLat: number,
  rawLng: number,
  tsMillis: number,
  source: SignalSource,
  opts: TransformOptions = {},
): SignalRecord {
  const cfg = { ...DEFAULT_CONFIG, ...opts.config };
  const rng = opts.rng ?? defaultRng;
  const newId = opts.newId ?? (() => globalThis.crypto.randomUUID());

  const cell = encode(rawLat, rawLng, cfg.bucketPrecision);
  const b = decodeBounds(cell);

  // Uniform-random point strictly within the cell (rng in [0,1) => < max).
  const jittered_lat = b.latMin + rng() * (b.latMax - b.latMin);
  const jittered_lng = b.lngMin + rng() * (b.lngMax - b.lngMin);

  const t = Math.floor(tsMillis / cfg.windowMs) * cfg.windowMs;

  return { id: newId(), cell, jittered_lat, jittered_lng, t, source };
}

export interface CellDensity {
  cell: string;
  count: number;
}

/**
 * Sparse-area suppression. Given records already filtered to a time window,
 * return per-cell densities for cells that meet the k-anonymity threshold.
 * Cells below the threshold are omitted so a lone sender can't be isolated.
 */
export function visibleCells(
  records: readonly SignalRecord[],
  kAnon: number = DEFAULT_CONFIG.kAnon,
): CellDensity[] {
  const counts = new Map<string, number>();
  for (const r of records) counts.set(r.cell, (counts.get(r.cell) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count >= kAnon)
    .map(([cell, count]) => ({ cell, count }));
}
