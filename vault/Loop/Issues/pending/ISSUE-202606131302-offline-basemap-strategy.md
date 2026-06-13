---
id: 202606131302
title: How should the map basemap behave offline — bundle tiles, or accept online OSM tiles?
status: pending
type: decision
created: 2026-06-13
raised_by: loop-orchestrate
blocks: none (architectural — cheaper to decide before polishing the map)
---

## Context
The PRD says the demo should "work fully offline." The app currently uses **online OpenStreetMap tiles** for the basemap, with graceful degradation: if tiles fail, the privacy dots + density still render on a styled background, so the app *functions* offline — but it won't look like a real map without a network. This is an architectural choice worth settling before we invest in map polish.

## Options
1. **Online OSM tiles + graceful fallback (current).** Best-looking when online (venue Wi-Fi); functions without tiles. Risk: ugly/empty basemap if the stage has no network.
2. **Bundle a minimal offline basemap** (e.g. a static styled GeoJSON of the demo area, or pre-cached MBTiles/raster for the demo bbox). Truly offline and on-brand; more work, demo-area-specific.
3. **No real basemap** — render dots/heatmap over an abstract styled canvas (calm gradient/grid). Always offline, distinctive, less "map-like".

## Recommendation
**Option 1 for now** (already built), and decide between **2** and **3** once the demo location is fixed (ISSUE-202606131301) and you've judged whether venue network is reliable. If offline reliability is critical, Option 2 scoped to just the demo bounding box is the safest on-stage bet.

## How to answer
Move to `Issues/approved/` (note the option) or `Issues/rejected/`, or reply.
