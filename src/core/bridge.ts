// JavaScriptCore bridge entry for the native macOS sender (TASK-202606131313).
//
// The native menu-bar app (Swift) embeds JavaScriptCore and evaluates a bundled
// build of THIS file as a classic script. The whole point is reuse: the native
// send path calls the *unchanged*, tested privacy core (transformSignal) instead
// of re-implementing privacy in Swift. Swift owns only the hotkey/tray; this
// file is the single, narrow surface it talks to.
//
// Why a separate entry (not import privacy.ts directly in Swift): JSC evaluates a
// plain script and has no module loader, so the build (npm run build:core) bundles
// privacy.ts + geohash.ts into one IIFE and this file attaches the public symbols
// onto `globalThis.WIJM`. Swift then reads `WIJM.transformSignal`.
//
// Randomness: JSC ships no Web Crypto, so the core's default RNG/UUID
// (globalThis.crypto.*) are NOT available here. Rather than shim crypto inside the
// bundle (which would hide the randomness source), the bridge REQUIRES the caller
// to inject a uniform-random fn in [0,1) and an opaque id generator. Swift passes a
// SecRandomCopyBytes-backed float and a UUID string, keeping the entropy source
// auditable on the Swift side. The privacy invariants are unchanged: jitter stays a
// uniform point within the cell, drawn per signal.

import {
  transformSignal as coreTransform,
  visibleCells as coreVisibleCells,
  type SignalRecord,
  type SignalSource,
} from "./privacy.ts";

/**
 * Native-facing transform. `rand01()` must return a fresh uniform float in [0,1)
 * each call (Swift: SecRandomCopyBytes); `newId()` returns an opaque, unlinkable
 * id (Swift: UUID string). These are injected because JSC lacks Web Crypto — the
 * core privacy math is untouched.
 */
function transformSignal(
  rawLat: number,
  rawLng: number,
  tsMillis: number,
  source: SignalSource,
  rand01: () => number,
  newId: () => string,
): SignalRecord {
  return coreTransform(rawLat, rawLng, tsMillis, source, {
    rng: rand01,
    newId,
  });
}

// The public surface exposed to JavaScriptCore. Keep this minimal: the sender
// needs exactly transformSignal; visibleCells is exposed for future native views.
const WIJM = {
  transformSignal,
  visibleCells: coreVisibleCells,
};

// Attach to the global so Swift can read `WIJM.transformSignal` after evaluating
// the bundle. (Vite lib/IIFE build also assigns the global name, but doing it
// explicitly keeps the contract obvious regardless of the bundler's wrapper.)
(globalThis as unknown as { WIJM: typeof WIJM }).WIJM = WIJM;

export { WIJM };
export type { SignalRecord, SignalSource };
