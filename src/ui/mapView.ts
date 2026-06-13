// Leaflet rendering for "Was It Just Me?".
//
// Two layers, both fed ONLY by privacy-safe data:
//   - dots: each visible SignalRecord at its jittered_lat/lng (already a uniform
//     random point inside the cell — never the true location).
//   - density: circleMarkers at densityGrid cell centers, sized/faded by count.
//     densityGrid already drops sub-k cells, so a lone sender is never shown.
//
// Tiles (OSM) are cosmetic: if they fail to load the dots/density still render
// over the CSS fallback background, honoring "works offline".

import * as L from "leaflet";
import type { SignalRecord } from "../core/privacy.ts";
import { densityGrid, type DensityCell } from "../core/aggregate.ts";
import type { LatLng } from "../sim/simulator.ts";
import { INITIAL_ZOOM, MAX_ZOOM, MIN_ZOOM } from "./config.ts";

export class MapView {
  private map: L.Map;
  private dotLayer = L.layerGroup();
  private densityLayer = L.layerGroup();
  // Verification-only layer: holds the EXACT, un-jittered captured point. It is
  // separate from the privacy-safe dot/density layers and is only ever populated
  // by the explicit, off-by-default verification path — never by normal records.
  private exactLayer = L.layerGroup();

  constructor(elementId: string, center: LatLng) {
    this.map = L.map(elementId, {
      center: [center.lat, center.lng],
      zoom: INITIAL_ZOOM,
      minZoom: MIN_ZOOM,
      // Cap zoom so the view can never imply finer-than-bucket precision.
      maxZoom: MAX_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    // Cosmetic basemap. errorTileUrl keeps the map silent if tiles 404/offline;
    // nothing functional depends on tiles loading.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: MAX_ZOOM,
      attribution: "&copy; OpenStreetMap contributors",
      errorTileUrl:
        "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
    }).addTo(this.map);

    this.densityLayer.addTo(this.map);
    this.dotLayer.addTo(this.map);
    this.exactLayer.addTo(this.map);
  }

  setShowDensity(show: boolean): void {
    if (show) this.densityLayer.addTo(this.map);
    else this.densityLayer.removeFrom(this.map);
  }

  /** Recenter (and gently zoom to) a point, e.g. the user's real location. */
  recenter(lat: number, lng: number, zoom: number = INITIAL_ZOOM): void {
    this.map.setView([lat, lng], zoom);
  }

  /**
   * VERIFICATION ONLY — plot the EXACT captured coordinates, bypassing the
   * privacy transform (no bucketing, no jitter). This is a debug aid to confirm
   * location capture is correct and is only called from the explicit, off-by-
   * default verification toggle. It NEVER touches the privacy-safe record path.
   */
  showExactLocation(lat: number, lng: number, accuracyM?: number): void {
    this.exactLayer.clearLayers();
    if (accuracyM !== undefined && accuracyM > 0) {
      L.circle([lat, lng], {
        radius: accuracyM,
        color: "#b00020",
        weight: 1,
        fillColor: "#b00020",
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(this.exactLayer);
    }
    L.circleMarker([lat, lng], {
      radius: 7,
      color: "#b00020",
      weight: 2,
      fillColor: "#ff5252",
      fillOpacity: 0.95,
      interactive: true,
    })
      .bindTooltip(
        `Exact location (verification): ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        { direction: "top", permanent: false },
      )
      .addTo(this.exactLayer);
  }

  /** Clear the verification-only exact-location marker. */
  clearExactLocation(): void {
    this.exactLayer.clearLayers();
  }

  /** Re-render both layers for the given (already time-filtered) record set. */
  render(records: readonly SignalRecord[]): void {
    this.renderDots(records);
    this.renderDensity(records);
  }

  private renderDots(records: readonly SignalRecord[]): void {
    this.dotLayer.clearLayers();
    for (const r of records) {
      L.circleMarker([r.jittered_lat, r.jittered_lng], {
        radius: 5,
        className: "signal-dot",
        color: "#4a90a4",
        weight: 1,
        fillColor: "#6fb3bf",
        fillOpacity: 0.85,
      }).addTo(this.dotLayer);
    }
  }

  private renderDensity(records: readonly SignalRecord[]): void {
    this.densityLayer.clearLayers();
    const grid = densityGrid(records);
    if (grid.length === 0) return;
    const maxCount = grid.reduce((m, c) => Math.max(m, c.count), 1);

    for (const cell of grid) {
      const marker = L.circleMarker([cell.centerLat, cell.centerLng], {
        radius: radiusFor(cell, maxCount),
        color: "#3a7d8c",
        weight: 0,
        fillColor: "#3a7d8c",
        fillOpacity: opacityFor(cell, maxCount),
        interactive: true,
      });
      marker.bindTooltip(tooltipFor(cell), { direction: "top" });
      marker.addTo(this.densityLayer);
    }
  }
}

function radiusFor(cell: DensityCell, maxCount: number): number {
  // 14..40 px, scaled by relative density. Never tied to a single sender.
  return 14 + (cell.count / maxCount) * 26;
}

function opacityFor(cell: DensityCell, maxCount: number): number {
  return 0.18 + (cell.count / maxCount) * 0.27;
}

function tooltipFor(cell: DensityCell): string {
  // Framing: people noticed something — never what, never who, never where exactly.
  return `${cell.count} people nearby noticed something`;
}
