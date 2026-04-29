---
name: uber-h3-react
description: Uber H3 hexagonal index for the deal-hunter map UI — resolution choice, h3-js API patterns, deck.gl H3HexagonLayer rendering, viewport queries, and best practices for storing/aggregating H3 cells in Postgres without PostGIS.
---

# Uber H3 in deal-hunter

[H3](https://h3geo.org/) is Uber's open-source global hexagonal hierarchical spatial index. The world is tiled by hexagonal cells at 16 resolutions (0–15); every cell has a single 64-bit index (passed in JS as a hex string like `"872830828ffffff"`); each parent cell contains ~7 children, so cells nest cleanly and let you roll aggregates up and down the hierarchy. For deal-hunter — a real-estate deals map with no PostGIS dependency — H3 is the right primitive: it gives us a stable text key per "neighborhood-sized" bucket that we can store in Postgres, group by for aggregates, and hand directly to deck.gl for rendering. This skill targets **h3-js v4.x** exclusively. The v3 names (`geoToH3`, `h3ToGeo`, `kRing`) are dead — old Stack Overflow answers will use them, ignore those.

## When to use this skill

- Bucketing listings into neighborhood-sized cells for aggregate stats (avg price, count, ROI per cell).
- Rendering a heatmap-style hex layer over the map at multiple zoom levels.
- Answering "show me deals near this point" or "show me deals in this viewport" without a GIS extension.
- Pre-filtering candidate listings server-side with a simple `WHERE h3 IN (...)` instead of a bbox/radius query.
- Caching tile-like aggregates keyed by H3 cell ID across resolutions.

## H3 fundamentals

- **Global hex grid.** ~122 base cells at resolution 0; from there each parent has ~7 children at the next finer resolution. Cell counts grow ~7× per level: 122 → 842 → 5,882 → 41,162 → 288,122 → 2,016,842 → … → 569,707,381,193,162 at res 15.
- **Pentagons.** Exactly 12 pentagon cells exist at every resolution (the rest are hexagons). They sit on the icosahedron vertices, mostly over open ocean. Most cities have none nearby — safe to ignore for v1, but `gridRingUnsafe` can throw near them. `gridDisk` is safe.
- **Index format.** A 64-bit unsigned integer. In JS it's almost always handled as a lowercase hex string (`"872830828ffffff"`). Storing as `text` in Postgres is the path of least resistance (see Storage section).
- **Resolution number is inverted.** Lower number = larger cell. Res 0 is continent-scale; res 15 is sub-meter.

### Resolution table (from the official [restable](https://h3geo.org/docs/core-library/restable))

| Res | Avg edge (km) | Avg area (km²) | Total cells | Best for |
|-----|---------------|----------------|-------------|----------|
| 0 | 1281.26 | 4,357,449.42 | 122 | continent |
| 1 | 483.06 | 609,788.44 | 842 | sub-continent |
| 2 | 182.51 | 86,801.78 | 5,882 | large country |
| 3 | 68.98 | 12,393.43 | 41,162 | small country / state |
| 4 | 26.07 | 1,770.35 | 288,122 | metro area cluster |
| 5 | 9.85 | 252.90 | 2,016,842 | large metro |
| 6 | 3.72 | 36.13 | 14,117,882 | metro region |
| 7 | 1.41 | 5.16 | 98,825,162 | suburb / borough |
| **8** | **0.53** | **0.74** | **691,776,122** | **neighborhood (primary unit)** |
| 9 | 0.20 | 0.11 | 4,842,432,842 | block |
| 10 | 0.075 | 0.015 | 33,897,029,882 | building cluster |
| 11 | 0.028 | 0.0021 | 237,279,209,162 | individual building |
| 12 | 0.011 | 0.0003 | 1,660,954,464,122 | room-scale |
| 13 | 0.004 | 0.00004 | 11,626,681,248,842 | desk-scale |
| 14 | 0.0015 | 0.000006 | 81,386,768,741,882 | sub-meter |
| 15 | 0.0006 | 0.0000009 | 569,707,381,193,162 | sub-meter |

## Choosing a resolution for deal-hunter

**Anchor on resolution 8** (~0.74 km², ~530 m edge) as the canonical "neighborhood" unit for deal-hunter. That's the resolution at which we store and aggregate listings.

Recommended pre-bucketing strategy: **store each listing's H3 cell at multiple parent resolutions** in denormalized columns so each zoom level can hit a covering index without recomputation:

- **Res 8** — primary aggregation unit. One row per listing carries its res-8 cell. Aggregate stats (avg price, count, ROI) are cached per res-8 cell.
- **Res 7 (~5 km²)** — borough / district zoom. Roll up res-8 aggregates into res-7 for the mid zoom layer.
- **Res 6 (~36 km²)** — city-wide heat at low zoom.
- **Res 9 (~0.11 km²)** / **Res 10** — drill-down detail when zoomed into a single neighborhood.

Rule of thumb for the renderer: **at any zoom level, render no more than ~500 hexes**. If `polygonToCells(viewport, currentRes)` returns more than that, drop one resolution (use the parent) and re-fetch. Also: never round-trip raw listings to the browser to bucket them — always aggregate server-side.

A reasonable zoom → resolution mapping (Mapbox/MapLibre zoom levels):

| Zoom | Resolution |
|------|------------|
| < 9 | 6 |
| 9–11 | 7 |
| 11–13 | 8 |
| 13–15 | 9 |
| > 15 | 10 |

Tune empirically against your viewport size; the cap is "~500 visible hexes," not the zoom number.

## h3-js v4 API surface

Install:

```bash
npm i h3-js
```

Import only what you need (tree-shakeable):

```ts
import {
  latLngToCell,
  cellToLatLng,
  cellToBoundary,
  gridDisk,
  gridDistance,
  polygonToCells,
  cellToParent,
  cellToChildren,
  compactCells,
  uncompactCells,
  getResolution,
} from "h3-js";
```

### Indexing

```ts
// Point → cell. lat first, then lng. Returns hex-string cell index.
latLngToCell(lat: number, lng: number, res: number): string

// Cell → center point. Returns [lat, lng] tuple.
cellToLatLng(cell: string): [number, number]

// Cell → polygon boundary.
// Default: [lat, lng] pairs. With formatAsGeoJson=true: [lng, lat], closed loop.
cellToBoundary(cell: string, formatAsGeoJson?: boolean): Array<[number, number]>
```

Example:

```ts
const cell = latLngToCell(40.7128, -74.0060, 8); // "882a100d2bfffff" — NYC at res 8
const [lat, lng] = cellToLatLng(cell);
const ring = cellToBoundary(cell, true); // GeoJSON-friendly [lng, lat]
```

### Traversal

```ts
// Filled disk of cells within k steps of origin (inclusive).
gridDisk(origin: string, k: number): string[]

// Hex hops between two cells. Throws on pentagon distortion.
gridDistance(a: string, b: string): number

// Hollow ring at exactly distance k. Unsafe near pentagons — prefer gridDisk
// and diff against (k-1) when you need a ring.
gridRingUnsafe(origin: string, k: number): string[]
```

### Regions (the viewport workhorse)

```ts
// Cover a polygon with cells. Containment is by cell centroid.
// polygon is [lat, lng] pairs by default; pass formatAsGeoJson=true to use [lng, lat].
polygonToCells(
  polygon: Array<[number, number]>,
  res: number,
  formatAsGeoJson?: boolean,
): string[]

// Inverse: outline a set of cells as a (multi)polygon.
cellsToMultiPolygon(cells: string[], formatAsGeoJson?: boolean): Array<Array<Array<[number, number]>>>
```

### Hierarchy

```ts
// Climb up. parentRes must be <= getResolution(cell).
cellToParent(cell: string, parentRes: number): string

// Drill down. Each step adds ~7×. Children at exactly childRes.
cellToChildren(cell: string, childRes: number): string[]

// Set compression: replace 7 sibling children with 1 parent recursively.
// All input cells must share a resolution.
compactCells(cells: string[]): string[]

// Inverse: expand a compacted (mixed-resolution) set back to a uniform res.
uncompactCells(cells: string[], res: number): string[]

// Get a cell's resolution (0–15).
getResolution(cell: string): number
```

## Storing H3 cells in Postgres (Drizzle, no PostGIS)

Per project conventions in [CLAUDE.md](../../../CLAUDE.md): the Drizzle client uses `casing: "snake_case"`, columns are written camelCase in TS and mapped to snake_case in SQL automatically. The DB client is lazy — always call `getDb()` inside the request handler.

### Schema pattern

Add denormalized H3 columns to the listings/deals table at multiple resolutions, each indexed:

```ts
// packages/db/src/schema.ts
import { pgTable, serial, text, integer, doublePrecision, timestamp, index } from "drizzle-orm/pg-core";

export const deals = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    priceCents: integer("price_cents").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    // H3 cells at three resolutions, computed once on insert.
    h3Res6: text("h3_res6").notNull(),
    h3Res7: text("h3_res7").notNull(),
    h3Res8: text("h3_res8").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("deals_h3_res6_idx").on(table.h3Res6),
    index("deals_h3_res7_idx").on(table.h3Res7),
    index("deals_h3_res8_idx").on(table.h3Res8),
  ],
);
```

**Tradeoff: store one column or three?** Storing only `h3Res8` saves disk and you can derive the parents via `cellToParent` at query time — but then aggregations require either a CTE that computes parents in JS first or a server-side function. Storing res 6/7/8 denormalized is ~24 extra bytes/row plus three indexes; in exchange every "give me aggregates at zoom X" query becomes a single `GROUP BY h3_resN`. For deal-hunter, **denormalize**.

`text` vs `bigint`: H3 indexes are 64-bit unsigned. `bigint` is the natural fit, but JS `BigInt` ↔ string round-tripping (especially over JSON) is painful, and an indexed 15-char `text` column is essentially free in Neon. **Default to `text`.**

### Computing on insert (API route)

```ts
// apps/web/src/app/api/deals/route.ts
import { getDb, deals } from "@deal-hunter/db";
import { latLngToCell } from "h3-js";

export async function POST(req: Request) {
  const { title, url, priceCents, lat, lng } = await req.json();
  const db = getDb();
  await db.insert(deals).values({
    title,
    url,
    priceCents,
    lat,
    lng,
    h3Res8: latLngToCell(lat, lng, 8),
    h3Res7: latLngToCell(lat, lng, 7),
    h3Res6: latLngToCell(lat, lng, 6),
  });
  return Response.json({ ok: true });
}
```

### Viewport query

```ts
// apps/web/src/app/api/deals/aggregate/route.ts
import { getDb, deals } from "@deal-hunter/db";
import { polygonToCells } from "h3-js";
import { inArray, sql } from "drizzle-orm";

export async function POST(req: Request) {
  const { bbox, res } = await req.json(); // bbox: [west, south, east, north], res: 6|7|8|9
  const [w, s, e, n] = bbox;
  // Polygon for polygonToCells: [lat, lng] pairs (default order), closed loop.
  const polygon: [number, number][] = [
    [s, w], [s, e], [n, e], [n, w], [s, w],
  ];
  let cells = polygonToCells(polygon, res);

  // Cap the IN list. If the viewport blows past it, drop one resolution.
  const MAX_CELLS = 1000;
  if (cells.length > MAX_CELLS) {
    cells = polygonToCells(polygon, res - 1);
  }

  const col = res === 6 ? deals.h3Res6 : res === 7 ? deals.h3Res7 : deals.h3Res8;
  const db = getDb();
  const rows = await db
    .select({
      hex: col,
      count: sql<number>`count(*)::int`,
      avgPrice: sql<number>`avg(${deals.priceCents})::int`,
    })
    .from(deals)
    .where(inArray(col, cells))
    .groupBy(col);

  return Response.json({ res, hexes: rows });
}
```

### Cached aggregates table

If listings churn slowly, cache aggregates instead of recomputing per request:

```ts
export const dealsAggH3 = pgTable(
  "deals_agg_h3",
  {
    h3: text("h3").primaryKey(),
    res: integer("res").notNull(),
    count: integer("count").notNull(),
    avgPriceCents: integer("avg_price_cents").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("deals_agg_h3_res_idx").on(table.res)],
);
```

Refresh on insert (or via a periodic job). For Neon HTTP without PG extensions, a plain `INSERT … ON CONFLICT (h3) DO UPDATE` is fine.

## Rendering hex layers in React with deck.gl

The canonical pairing for H3 in a React app is [deck.gl](https://deck.gl) on top of [react-map-gl](https://visgl.github.io/react-map-gl/) (Mapbox or MapLibre as the basemap). deck.gl ships [`H3HexagonLayer`](https://deck.gl/docs/api-reference/geo-layers/h3-hexagon-layer) which **accepts H3 cell strings directly** — it computes boundaries internally, so do not pre-compute polygons unless you have a specific reason.

Install:

```bash
npm i deck.gl @deck.gl/react @deck.gl/geo-layers @deck.gl/layers react-map-gl maplibre-gl
# or, if you prefer Mapbox:
# npm i deck.gl @deck.gl/react @deck.gl/geo-layers @deck.gl/layers react-map-gl mapbox-gl
```

### Minimal map component

```tsx
// apps/web/src/components/DealsMap.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type HexAggregate = { hex: string; count: number; avgPrice: number };

const INITIAL_VIEW = { longitude: -74.006, latitude: 40.7128, zoom: 11, pitch: 0, bearing: 0 };

function zoomToRes(zoom: number) {
  if (zoom < 9) return 6;
  if (zoom < 11) return 7;
  if (zoom < 13) return 8;
  if (zoom < 15) return 9;
  return 10;
}

function colorScale(price: number): [number, number, number, number] {
  // Map cents → green→red. Replace with your own ramp.
  const t = Math.min(1, Math.max(0, (price - 50_000_00) / (200_000_00 - 50_000_00)));
  return [Math.round(255 * t), Math.round(180 * (1 - t)), 80, 200];
}

export function DealsMap() {
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [aggregates, setAggregates] = useState<HexAggregate[]>([]);

  // Debounced viewport → server request.
  useEffect(() => {
    const handle = setTimeout(async () => {
      const res = zoomToRes(viewState.zoom);
      const halfDeg = 180 / Math.pow(2, viewState.zoom);
      const bbox = [
        viewState.longitude - halfDeg,
        viewState.latitude - halfDeg,
        viewState.longitude + halfDeg,
        viewState.latitude + halfDeg,
      ];
      const r = await fetch("/api/deals/aggregate", {
        method: "POST",
        body: JSON.stringify({ bbox, res }),
      });
      const { hexes } = await r.json();
      setAggregates(hexes);
    }, 250); // debounce
    return () => clearTimeout(handle);
  }, [viewState]);

  const layer = useMemo(
    () =>
      new H3HexagonLayer<HexAggregate>({
        id: "deals",
        data: aggregates,
        getHexagon: (d) => d.hex,
        getFillColor: (d) => colorScale(d.avgPrice),
        extruded: false,
        pickable: true,
        stroked: true,
        getLineColor: [255, 255, 255, 80],
        lineWidthMinPixels: 1,
      }),
    [aggregates],
  );

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW}
      controller
      layers={[layer]}
      onViewStateChange={({ viewState: vs }) => setViewState(vs as typeof INITIAL_VIEW)}
    >
      <Map mapStyle="https://demotiles.maplibre.org/style.json" />
    </DeckGL>
  );
}
```

Note the `"use client"` directive — deck.gl is browser-only and must not run during Next.js server rendering. If you need to defer loading, wrap the import in `next/dynamic` with `{ ssr: false }`.

### When to use `H3ClusterLayer` instead

[`H3ClusterLayer`](https://deck.gl/docs/api-reference/geo-layers/h3-cluster-layer) renders **regions defined by sets of H3 cells** as merged outlines (one polygon per cluster) rather than per-cell hexes. Use it for: drawn neighborhoods, named regions, "saved searches" boundaries — anywhere the user cares about the *outline* of an area, not per-hex aggregates. For the deals heatmap, stick with `H3HexagonLayer`.

## Performance best practices

- **Aggregate server-side, always.** Don't ship 50k listings to the browser to bucket them. `GROUP BY h3_resN` in Postgres on an indexed text column is fast and scales linearly.
- **Cap the viewport hex count.** If `polygonToCells(viewportPolygon, currentRes).length > 1000`, drop to `currentRes - 1` and use parent cells. The user can't perceive >500 hexes anyway.
- **Debounce viewport queries** (200–300 ms after the user stops panning/zooming). React `useEffect` with a `setTimeout` cleanup is enough; for heavier UX, use `requestIdleCallback`.
- **Cache aggregates.** Either a `deals_agg_h3` rollup table or HTTP `Cache-Control: public, s-maxage=…` on the API route; Vercel's edge cache will serve the same viewport from cache.
- **Compact set payloads.** When sending dense H3 sets over the wire (e.g., the cells covering a neighborhood for "save this search"), call `compactCells(cells)` first; the receiver calls `uncompactCells(set, res)` to expand.
- **Prefer `H3ClusterLayer` for very dense / merged-region rendering.** For per-cell stats, `H3HexagonLayer`.
- **Pentagons.** 12 exist globally per resolution. They distort `gridRingUnsafe` and can affect `gridDistance` near them. For US/EU city work you will not encounter them; if you do, prefer `gridDisk` (safe).

## Common pitfalls

- **Mixing v3 and v4 API names.** v4 names: `latLngToCell`, `cellToLatLng`, `cellToBoundary`, `gridDisk`, `polygonToCells`, `compactCells`, `uncompactCells`. v3 names (`geoToH3`, `h3ToGeo`, `kRing`, `compact`, `uncompact`) are gone. Most blog posts on the internet are still v3.
- **Lat/lng order.** H3 takes `(lat, lng)`. Most map libraries (deck.gl, GeoJSON) use `(lng, lat)`. Convert at the boundary. `cellToBoundary` defaults to `[lat, lng]`; pass `formatAsGeoJson: true` to get `[lng, lat]` for GeoJSON / deck.gl polygon consumers.
- **Resolution direction.** Lower number = larger cell. A res-9 cell is **not** the parent of a res-8 cell. Easy to invert by accident — `cellToParent(cell, lowerNumber)`.
- **Storing as `bigint`.** Works, but JS `BigInt` ↔ string conversion through JSON is annoying. Default to `text` columns. The index size penalty is negligible at any reasonable row count.
- **Forgetting to bucket on the way in.** If listings are inserted without their H3 cells precomputed, every query has to bucket them on read. Always compute `latLngToCell` at insert time (or in a backfill).
- **Centroid containment.** `polygonToCells` decides containment by **cell centroid**. A cell whose centroid is just outside your viewport polygon is excluded even if half the hex is inside — pad your bbox slightly (e.g., 1 cell edge) before calling it for viewport queries.
- **`gridRingUnsafe` near pentagons.** Throws. Use `gridDisk(c, k)` minus `gridDisk(c, k-1)` if you need a ring without the unsafe variant.
- **SSR.** deck.gl and `react-map-gl` are browser-only. Always `"use client"` and consider `next/dynamic` with `{ ssr: false }`.

## Quick reference card

The five things you'll do most often:

```ts
import {
  latLngToCell, cellToLatLng, gridDisk, polygonToCells, cellToParent,
} from "h3-js";

// 1. Encode point → cell
const cell = latLngToCell(40.7128, -74.0060, 8); // "882a100d2bfffff"

// 2. Decode cell → center
const [lat, lng] = cellToLatLng(cell);

// 3. Get neighbors (k-ring)
const neighbors = gridDisk(cell, 1); // cell + 6 neighbors

// 4. Cover a viewport (bbox as [lat,lng] polygon, closed loop)
const cells = polygonToCells(
  [[s, w], [s, e], [n, e], [n, w], [s, w]],
  8,
);

// 5. Climb the hierarchy (drop one zoom level)
const parent = cellToParent(cell, 7);
```
