"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { Map } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { FlyToInterpolator, WebMercatorViewport, type PickingInfo } from "@deck.gl/core";

export type HexAggregate = { hex: string; count: number; avgPrice: number };
export type LngLatBounds = [[number, number], [number, number]];

const STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const INITIAL_VIEW_STATE = {
  longitude: -75.5812,
  latitude: 6.2476,
  zoom: 11,
  pitch: 0,
  bearing: 0,
};

const FIT_PADDING = 60;
const FIT_MAX_ZOOM = 14;
const FLY_DURATION_MS = 900;

// ── Price color scale ─────────────────────────────────────────────────────
type RGBA = [number, number, number, number];

/**
 * Diverging RdYlGn palette (reversed so green = cold/cheap, red = hot/expensive).
 * Eight stops give smooth transitions across the spectrum, with yellow as the
 * neutral midpoint per heatmap convention. Colors come from ColorBrewer's
 * 9-class RdYlGn — we drop the lightest near-white middle stops to keep
 * mid-price hexes visible against the basemap.
 *
 * Absolute scale (anchored to global priceMin/priceMax) so dark red always
 * means "expensive" regardless of which slice is currently shown.
 */
export const PRICE_STOPS: Array<[number, RGBA]> = [
  [0.0, [0, 104, 55, 220]],     // dark green
  [0.15, [26, 152, 80, 225]],   // green
  [0.3, [102, 189, 99, 225]],   // light green
  [0.45, [217, 239, 139, 230]], // yellow-green
  [0.55, [254, 224, 139, 230]], // light yellow
  [0.7, [253, 174, 97, 235]],   // orange
  [0.85, [244, 109, 67, 240]],  // red-orange
  [1.0, [165, 0, 38, 245]],     // dark red
];

function interpolate(stops: Array<[number, RGBA]>, t: number): RGBA {
  if (t <= 0) return stops[0]![1];
  if (t >= 1) return stops.at(-1)![1];
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i]!;
    if (t <= t1) {
      const [t0, c0] = stops[i - 1]!;
      const f = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
        Math.round(c0[3] + (c1[3] - c0[3]) * f),
      ];
    }
  }
  return stops.at(-1)![1];
}

function formatCOP(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

function boundsEqual(a: LngLatBounds | null, b: LngLatBounds | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  const e = 1e-4;
  return (
    Math.abs(a[0][0] - b[0][0]) < e &&
    Math.abs(a[0][1] - b[0][1]) < e &&
    Math.abs(a[1][0] - b[1][0]) < e &&
    Math.abs(a[1][1] - b[1][1]) < e
  );
}

export function MapView({
  hexes,
  fitBounds,
  showHeatmap,
  priceMin,
  priceMax,
}: {
  hexes: HexAggregate[];
  fitBounds: LngLatBounds | null;
  showHeatmap: boolean;
  priceMin: number;
  priceMax: number;
}) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFitRef = useRef<LngLatBounds | null>(null);
  const isFirstFitRef = useRef(true);
  const [viewState, setViewState] = useState<Record<string, unknown>>(INITIAL_VIEW_STATE);
  const [hover, setHover] = useState<PickingInfo<HexAggregate> | null>(null);

  const styleUrl = resolvedTheme === "light" ? STYLE_LIGHT : STYLE_DARK;
  const priceRange = Math.max(1, priceMax - priceMin);

  const layers = useMemo(
    () => [
      new H3HexagonLayer<HexAggregate>({
        id: "deals-price",
        data: hexes,
        getHexagon: (d) => d.hex,
        getFillColor: (d) =>
          interpolate(PRICE_STOPS, (d.avgPrice - priceMin) / priceRange),
        extruded: false,
        stroked: false,
        filled: true,
        pickable: true,
        visible: showHeatmap,
        updateTriggers: { getFillColor: [priceMin, priceMax] },
      }),
    ],
    [hexes, showHeatmap, priceMin, priceMax, priceRange],
  );

  // Auto-fit — first fit is instant; subsequent fits animate.
  useEffect(() => {
    if (!fitBounds || !containerRef.current) return;
    if (boundsEqual(lastFitRef.current, fitBounds)) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const viewport = new WebMercatorViewport({ width, height });
    const fitted = viewport.fitBounds(fitBounds, {
      padding: FIT_PADDING,
      maxZoom: FIT_MAX_ZOOM,
    });

    setViewState({
      longitude: fitted.longitude,
      latitude: fitted.latitude,
      zoom: fitted.zoom,
      pitch: 0,
      bearing: 0,
      transitionDuration: isFirstFitRef.current ? 0 : FLY_DURATION_MS,
      transitionInterpolator: new FlyToInterpolator(),
    });

    isFirstFitRef.current = false;
    lastFitRef.current = fitBounds;
  }, [fitBounds]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <DeckGL
        viewState={viewState}
        controller={true}
        layers={layers}
        onViewStateChange={({ viewState: next }) =>
          setViewState(next as Record<string, unknown>)
        }
        onHover={(info) => setHover(info.object ? info : null)}
      >
        <Map key={styleUrl} mapStyle={styleUrl} attributionControl={{ compact: true }} />
      </DeckGL>

      {hover?.object && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-bg-card text-fg text-label px-3 py-2 border border-border"
          style={{
            left: hover.x + 12,
            top: hover.y + 12,
            boxShadow: "var(--shadow-neu-sm)",
          }}
        >
          <div className="font-semibold">
            {hover.object.count}{" "}
            {hover.object.count === 1 ? "property" : "properties"}
          </div>
          <div className="text-fg-muted">avg {formatCOP(hover.object.avgPrice)}</div>
        </div>
      )}
    </div>
  );
}
