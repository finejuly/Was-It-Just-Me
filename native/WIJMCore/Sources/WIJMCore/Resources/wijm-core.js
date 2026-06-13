"use strict";
var WIJM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/core/bridge.ts
  var bridge_exports = {};
  __export(bridge_exports, {
    WIJM: () => WIJM
  });

  // src/core/geohash.ts
  var BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  function encode(lat, lng, precision) {
    if (precision < 1) throw new Error("geohash precision must be >= 1");
    let idx = 0;
    let bit = 0;
    let evenBit = true;
    let hash = "";
    let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
    while (hash.length < precision) {
      if (evenBit) {
        const mid = (lngMin + lngMax) / 2;
        if (lng >= mid) {
          idx = idx * 2 + 1;
          lngMin = mid;
        } else {
          idx = idx * 2;
          lngMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (lat >= mid) {
          idx = idx * 2 + 1;
          latMin = mid;
        } else {
          idx = idx * 2;
          latMax = mid;
        }
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
  function decodeBounds(hash) {
    let evenBit = true;
    let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
    for (const ch of hash) {
      const cd = BASE32.indexOf(ch);
      if (cd === -1) throw new Error(`invalid geohash character: ${ch}`);
      for (let n = 4; n >= 0; n--) {
        const bitN = cd >> n & 1;
        if (evenBit) {
          const mid = (lngMin + lngMax) / 2;
          if (bitN) lngMin = mid;
          else lngMax = mid;
        } else {
          const mid = (latMin + latMax) / 2;
          if (bitN) latMin = mid;
          else latMax = mid;
        }
        evenBit = !evenBit;
      }
    }
    return { latMin, latMax, lngMin, lngMax };
  }

  // src/core/privacy.ts
  var DEFAULT_CONFIG = {
    bucketPrecision: 6,
    windowMs: 6e4,
    kAnon: 3
  };
  var defaultRng = () => {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  };
  function transformSignal(rawLat, rawLng, tsMillis, source, opts = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...opts.config };
    const rng = opts.rng ?? defaultRng;
    const newId = opts.newId ?? (() => globalThis.crypto.randomUUID());
    const cell = encode(rawLat, rawLng, cfg.bucketPrecision);
    const b = decodeBounds(cell);
    const jittered_lat = b.latMin + rng() * (b.latMax - b.latMin);
    const jittered_lng = b.lngMin + rng() * (b.lngMax - b.lngMin);
    const t = Math.floor(tsMillis / cfg.windowMs) * cfg.windowMs;
    return { id: newId(), cell, jittered_lat, jittered_lng, t, source };
  }
  function visibleCells(records, kAnon = DEFAULT_CONFIG.kAnon) {
    const counts = /* @__PURE__ */ new Map();
    for (const r of records) counts.set(r.cell, (counts.get(r.cell) ?? 0) + 1);
    return [...counts.entries()].filter(([, count]) => count >= kAnon).map(([cell, count]) => ({ cell, count }));
  }

  // src/core/bridge.ts
  function transformSignal2(rawLat, rawLng, tsMillis, source, rand01, newId) {
    return transformSignal(rawLat, rawLng, tsMillis, source, {
      rng: rand01,
      newId
    });
  }
  var WIJM = {
    transformSignal: transformSignal2,
    visibleCells
  };
  globalThis.WIJM = WIJM;
  return __toCommonJS(bridge_exports);
})();
