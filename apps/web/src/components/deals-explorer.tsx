"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { latLngToCell } from "h3-js";
import { FilterPanel } from "@/components/filter-panel";
import { HeatmapLegend } from "@/components/heatmap-legend";
import { MapView, type HexAggregate, type LayerVisibility, type LngLatBounds } from "@/components/map-view";
import { MatchCount } from "@/components/match-count";
import { PropertyDrawer } from "@/components/property-drawer";
import { useT } from "@/lib/i18n/provider";

export type DealPoint = {
  lat: number;
  lng: number;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  neighborhood: string;
  discountPct: number | null;
};

export type Filters = {
  priceRange: [number, number];
  areaRange: [number, number];
  propertyTypes: ReadonlySet<string>;
  bedroomBuckets: ReadonlySet<number>; // 1, 2, 3, 4 (where 4 means "4+")
  neighborhoods: ReadonlySet<string>;
};

const H3_RESOLUTION = 10; // ~65m edge — block / building-cluster scale
const FIT_DEBOUNCE_MS = 300;

function aggregateToHexes(points: DealPoint[], res: number): HexAggregate[] {
  const buckets = new Map<
    string,
    { count: number; sum: number; sumDiscount: number; countDiscount: number }
  >();
  for (const p of points) {
    const cell = latLngToCell(p.lat, p.lng, res);
    const b = buckets.get(cell);
    if (b) {
      b.count++;
      b.sum += p.price;
      if (p.discountPct !== null) {
        b.sumDiscount += p.discountPct;
        b.countDiscount++;
      }
    } else {
      buckets.set(cell, {
        count: 1,
        sum: p.price,
        sumDiscount: p.discountPct ?? 0,
        countDiscount: p.discountPct !== null ? 1 : 0,
      });
    }
  }
  return Array.from(buckets, ([hex, b]) => {
    const avgDiscount =
      b.countDiscount > 0
        ? Math.round((b.sumDiscount / b.countDiscount) * 10) / 10
        : null;
    return {
      hex,
      count: b.count,
      avgPrice: Math.round(b.sum / b.count),
      avgDiscount,
    };
  });
}

function computeBounds(points: DealPoint[]): LngLatBounds | null {
  if (points.length === 0) return null;
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const p of points) {
    if (p.lng < west) west = p.lng;
    if (p.lng > east) east = p.lng;
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
  }
  return [
    [west, south],
    [east, north],
  ];
}

function deriveBounds(values: number[], step = 1) {
  if (values.length === 0) return { min: 0, max: step };
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step,
  };
}

const BEDROOM_BUCKETS = [1, 2, 3, 4] as const; // 4 = "4+"
const BATHROOM_BUCKETS = [1, 2, 3, 4] as const; // 4 = "4+"

export function DealsExplorer({ points }: { points: DealPoint[] }) {
  const t = useT();
  // ── Slider bounds derived from data ────────────────────────────────────
  const { priceMin, priceMax } = useMemo(() => {
    const { min, max } = deriveBounds(
      points.map((p) => p.price),
      10_000_000,
    );
    return { priceMin: min, priceMax: max };
  }, [points]);

  const { areaMin, areaMax } = useMemo(() => {
    const { min, max } = deriveBounds(
      points.map((p) => p.area),
      5,
    );
    return { areaMin: min, areaMax: max };
  }, [points]);

  // Property types and neighborhoods present in data — sorted for stable UI
  const allPropertyTypes = useMemo(() => {
    const set = new Set(points.map((p) => p.propertyType));
    return Array.from(set).sort();
  }, [points]);

  const allNeighborhoods = useMemo(() => {
    const set = new Set(points.map((p) => p.neighborhood));
    return Array.from(set).sort();
  }, [points]);

  // ── Filter state ───────────────────────────────────────────────────────
  const [priceRange, setPriceRange] = useState<[number, number]>([priceMin, priceMax]);
  const [areaRange, setAreaRange] = useState<[number, number]>([areaMin, areaMax]);
  const [propertyTypes, setPropertyTypes] = useState<ReadonlySet<string>>(new Set());
  const [bedroomBuckets, setBedroomBuckets] = useState<ReadonlySet<number>>(new Set());
  const [bathroomBuckets, setBathroomBuckets] = useState<ReadonlySet<number>>(new Set());
  const [neighborhoods, setNeighborhoods] = useState<ReadonlySet<string>>(new Set());
  const [minDiscount, setMinDiscount] = useState<number>(-10);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({ price: true, discount: false });

  // ── Filter pipeline ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return points.filter((p) => {
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (p.area < areaRange[0] || p.area > areaRange[1]) return false;
      if (propertyTypes.size > 0 && !propertyTypes.has(p.propertyType)) return false;
      if (bedroomBuckets.size > 0) {
        const bucket = p.bedrooms >= 4 ? 4 : p.bedrooms;
        if (!bedroomBuckets.has(bucket)) return false;
      }
      if (bathroomBuckets.size > 0) {
        const bucket = p.bathrooms >= 4 ? 4 : p.bathrooms;
        if (!bathroomBuckets.has(bucket)) return false;
      }
      if (neighborhoods.size > 0 && !neighborhoods.has(p.neighborhood)) return false;
      if (minDiscount > -10) {
        if (p.discountPct === null) return false;
        if (p.discountPct < minDiscount) return false;
      }
      return true;
    });
  }, [points, priceRange, areaRange, propertyTypes, bedroomBuckets, bathroomBuckets, neighborhoods, minDiscount]);

  const hexes = useMemo(() => aggregateToHexes(filtered, H3_RESOLUTION), [filtered]);

  // ── Auto-fit bounds (debounced so slider drags don't trigger animation chaos)
  const [debouncedFiltered, setDebouncedFiltered] = useState(filtered);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFiltered(filtered), FIT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filtered]);

  const fitBounds = useMemo(() => computeBounds(debouncedFiltered), [debouncedFiltered]);

  const hasActiveFilters =
    priceRange[0] !== priceMin ||
    priceRange[1] !== priceMax ||
    areaRange[0] !== areaMin ||
    areaRange[1] !== areaMax ||
    propertyTypes.size > 0 ||
    bedroomBuckets.size > 0 ||
    bathroomBuckets.size > 0 ||
    neighborhoods.size > 0 ||
    minDiscount > -10;

  const resetFilters = useCallback(() => {
    setPriceRange([priceMin, priceMax]);
    setAreaRange([areaMin, areaMax]);
    setPropertyTypes(new Set());
    setBedroomBuckets(new Set());
    setBathroomBuckets(new Set());
    setNeighborhoods(new Set());
    setMinDiscount(-10);
  }, [priceMin, priceMax, areaMin, areaMax]);

  // ── Property drawer ────────────────────────────────────────────────────
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const selectedProperty = useMemo(() => {
    if (!selectedHex) return null;
    return (
      filtered.find((p) => latLngToCell(p.lat, p.lng, H3_RESOLUTION) === selectedHex) ??
      null
    );
  }, [selectedHex, filtered]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Mobile-only page title — stays at the top of the viewport even
       * though the filter panel sits below the map on small screens. */}
      <header className="md:hidden shrink-0 border-b border-border bg-bg-card px-4 py-3">
        <h1 className="text-h3 font-semibold text-fg leading-tight">
          {t("panel.heading")}
        </h1>
      </header>
      {/* flex-col-reverse on mobile puts the map section above the filter
       * panel (DOM order keeps filters first so md:flex-row still renders
       * them on the left at desktop sizes). */}
      <main className="flex-1 flex flex-col-reverse md:flex-row min-h-0">
        <FilterPanel
          priceMin={priceMin}
          priceMax={priceMax}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          areaMin={areaMin}
          areaMax={areaMax}
          areaRange={areaRange}
          onAreaRangeChange={setAreaRange}
          allPropertyTypes={allPropertyTypes}
          propertyTypes={propertyTypes}
          onPropertyTypesChange={setPropertyTypes}
          bedroomBuckets={bedroomBuckets}
          onBedroomBucketsChange={setBedroomBuckets}
          bedroomOptions={BEDROOM_BUCKETS}
          bathroomBuckets={bathroomBuckets}
          onBathroomBucketsChange={setBathroomBuckets}
          bathroomOptions={BATHROOM_BUCKETS}
          allNeighborhoods={allNeighborhoods}
          neighborhoods={neighborhoods}
          onNeighborhoodsChange={setNeighborhoods}
          minDiscount={minDiscount}
          onMinDiscountChange={setMinDiscount}
          layerVisibility={layerVisibility}
          onLayerVisibilityChange={setLayerVisibility}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        />
        <section className="relative flex-1 min-h-[60vh] md:min-h-0 flex flex-col">
          {/* Desktop-only page title — sits above the heatmap legend so the
           * map column reads as: title → price legend → map. */}
          <header className="hidden md:block shrink-0 border-b border-border bg-bg-card px-6 py-3">
            <h1 className="text-h3 font-semibold text-fg leading-tight">
              {t("panel.heading")}
            </h1>
          </header>
          <HeatmapLegend priceMin={priceMin} priceMax={priceMax} />
          <div className="relative flex-1 min-h-0">
            <MatchCount matched={filtered.length} total={points.length} />
            <MapView
              hexes={hexes}
              fitBounds={fitBounds}
              priceMin={priceMin}
              priceMax={priceMax}
              layerVisibility={layerVisibility}
              onHexClick={setSelectedHex}
            />
          </div>
        </section>
      </main>
      {selectedProperty && (
        <PropertyDrawer
          property={selectedProperty}
          onClose={() => setSelectedHex(null)}
        />
      )}
    </div>
  );
}
