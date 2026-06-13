// Minimal, dependency-free geohash encode + cell-bounds decode.
// Used by the privacy transform for spatial bucketing. No external deps so the
// privacy core stays pure and runnable anywhere (browser, Node, tests).

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export interface CellBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

/** Encode a coordinate to a geohash string of the given precision (length). */
export function encode(lat: number, lng: number, precision: number): string {
  if (precision < 1) throw new Error("geohash precision must be >= 1");
  let idx = 0;
  let bit = 0;
  let evenBit = true; // even bits encode longitude, odd bits latitude
  let hash = "";
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;

  while (hash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) { idx = idx * 2 + 1; lngMin = mid; } else { idx = idx * 2; lngMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { idx = idx * 2 + 1; latMin = mid; } else { idx = idx * 2; latMax = mid; }
    }
    evenBit = !evenBit;
    if (++bit === 5) {
      hash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }
  return hash;
}

/** Decode a geohash to the bounding box of its cell. */
export function decodeBounds(hash: string): CellBounds {
  let evenBit = true;
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;

  for (const ch of hash) {
    const cd = BASE32.indexOf(ch);
    if (cd === -1) throw new Error(`invalid geohash character: ${ch}`);
    for (let n = 4; n >= 0; n--) {
      const bitN = (cd >> n) & 1;
      if (evenBit) {
        const mid = (lngMin + lngMax) / 2;
        if (bitN) lngMin = mid; else lngMax = mid;
      } else {
        const mid = (latMin + latMax) / 2;
        if (bitN) latMin = mid; else latMax = mid;
      }
      evenBit = !evenBit;
    }
  }
  return { latMin, latMax, lngMin, lngMax };
}
