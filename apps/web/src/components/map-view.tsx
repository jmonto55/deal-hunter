"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { FlyToInterpolator, WebMercatorViewport, type PickingInfo } from "@deck.gl/core";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

export type HexAggregate = { hex: string; count: number; avgPrice: number };
export type LngLatBounds = [[number, number], [number, number]];

// `voyager` is Carto's detailed light style — shows street names, parks,
// water bodies, neighborhood boundaries. `dark-matter` stays for dark mode
// (Carto's only detailed dark style is too colorful and fights the heatmap).
const STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

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
 * Diverging RdYlGn palette (reversed so green = cheap, red = expensive).
 * 10 stops from ColorBrewer's 11-class scale, dropping the bleached
 * `#ffffbf` middle stop so mid-price hexes don't fade against light
 * basemaps. More stops = finer color transitions.
 *
 * Absolute scale (anchored to global priceMin/priceMax) so dark red always
 * means "expensive" regardless of which slice is currently shown. The sqrt
 * normalization at the call site stretches the cheap-mid range across more
 * of the gradient (where ~80% of properties cluster) so listings in that
 * band become visually distinguishable.
 */
export const PRICE_STOPS: Array<[number, RGBA]> = [
  [0.0,  [0,   104, 55,  220]], // dark green   #006837
  [0.11, [26,  152, 80,  225]], // green        #1a9850
  [0.22, [102, 189, 99,  225]], // light green  #66bd63
  [0.33, [166, 217, 106, 225]], // lime         #a6d96a
  [0.44, [217, 239, 139, 230]], // pale lime    #d9ef8b
  [0.56, [254, 224, 139, 230]], // pale yellow  #fee08b
  [0.67, [253, 174, 97,  235]], // amber        #fdae61
  [0.78, [244, 109, 67,  240]], // orange-red   #f46d43
  [0.89, [215, 48,  39,  245]], // red          #d73027
  [1.0,  [165, 0,   38,  250]], // dark red     #a50026
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
  priceMin,
  priceMax,
}: {
  hexes: HexAggregate[];
  fitBounds: LngLatBounds | null;
  priceMin: number;
  priceMax: number;
}) {
  const t = useT();
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
        // sqrt() stretches the cheap-mid range across more of the gradient.
        // Without it, ~80% of hexes cluster at the green end and become
        // visually indistinguishable; with it, that band spreads across
        // green → lime → yellow → amber for real differentiation.
        getFillColor: (d) =>
          interpolate(
            PRICE_STOPS,
            Math.sqrt((d.avgPrice - priceMin) / priceRange),
          ),
        extruded: false,
        stroked: false,
        filled: true,
        pickable: true,
        updateTriggers: { getFillColor: [priceMin, priceMax] },
      }),
    ],
    [hexes, priceMin, priceMax, priceRange],
  );

  /**
   * Fit the viewport to the current `fitBounds` and fly there. Reused by
   * both the auto-fit effect (when filters change) and the manual reset
   * FAB (when the user wants to recenter after panning).
   */
  const flyToBounds = useCallback(
    (duration: number) => {
      if (!fitBounds || !containerRef.current) return;
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
        transitionDuration: duration,
        transitionInterpolator: new FlyToInterpolator(),
      });

      lastFitRef.current = fitBounds;
    },
    [fitBounds],
  );

  // Auto-fit on bounds change. First fit is instant; subsequent fits animate.
  // Skips if the bounds haven't actually changed (e.g. toggling a filter that
  // doesn't affect extent).
  useEffect(() => {
    if (!fitBounds) return;
    if (boundsEqual(lastFitRef.current, fitBounds)) return;
    flyToBounds(isFirstFitRef.current ? 0 : FLY_DURATION_MS);
    isFirstFitRef.current = false;
  }, [fitBounds, flyToBounds]);

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

      {/* Fit-to-filter FAB. `bg-bg-elevated` is brighter than the basemap
       * in both themes (vs `bg-bg-base` which matches the dark map exactly
       * and disappears), and the rounded-full + drop-shadow gives the
       * floating-above-the-map feel of standard map controls. */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => flyToBounds(FLY_DURATION_MS)}
        disabled={!fitBounds}
        aria-label={t("map.fitToFilters")}
        title={t("map.fitToFilters")}
        className="absolute top-3 right-3 z-10 rounded-full bg-bg-elevated/95 backdrop-blur-sm shadow-md hover:bg-bg-elevated"
      >
        <Maximize2 />
      </Button>

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
            {hover.object.count === 1 ? t("map.propertySingular") : t("map.propertyPlural")}
          </div>
          <div className="text-fg-muted">
            {t("map.avg")} {formatCOP(hover.object.avgPrice)}
          </div>
        </div>
      )}
    </div>
  );
}
