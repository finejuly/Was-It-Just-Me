// Browser geolocation helper for "Was It Just Me?".
//
// This is the ONLY place the app reads the device's real location. It lives in
// the UI layer (never in the pure core/sim) and returns a raw lat/lng that the
// caller is responsible for routing through the privacy transform before any
// record is stored/displayed — EXCEPT the explicit, off-by-default verification
// path, which intentionally plots the exact point to confirm capture is correct.

import type { LatLng } from "../sim/simulator.ts";

export type GeoFailureKind = "unsupported" | "denied" | "unavailable" | "timeout";

export interface GeoError {
  kind: GeoFailureKind;
  message: string;
}

export interface GeoFix {
  /** Raw captured coordinates. Privacy-sensitive; do not store as-is. */
  coords: LatLng;
  /** Reported accuracy radius in meters (best-effort; may be large). */
  accuracyM: number;
}

/**
 * Request the device's current position once. Resolves with a raw fix or
 * rejects with a categorized {@link GeoError}. Never throws synchronously.
 *
 * Note: `navigator.geolocation` cannot be exercised in a headless test run, so
 * this is verified by compilation + reasoning; the promise wrapper mirrors the
 * standard callback API exactly.
 */
export function getCurrentPosition(
  opts: PositionOptions = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject({
        kind: "unsupported",
        message: "This device or browser does not support location.",
      } satisfies GeoError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracyM: pos.coords.accuracy,
        }),
      (err) => reject(toGeoError(err)),
      opts,
    );
  });
}

function toGeoError(err: GeolocationPositionError): GeoError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return { kind: "denied", message: "Location permission was denied." };
    case err.POSITION_UNAVAILABLE:
      return { kind: "unavailable", message: "Your location is currently unavailable." };
    case err.TIMEOUT:
      return { kind: "timeout", message: "Timed out while finding your location." };
    default:
      return { kind: "unavailable", message: "Could not determine your location." };
  }
}
