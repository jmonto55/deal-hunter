"use client";

import { useEffect, useMemo, useState } from "react";
import { latLngToCell } from "h3-js";
import { FilterPanel } from "@/components/filter-panel";
import { MapView, type HexAggregate, type LngLatBounds } from "@/components/map-view";

export type DealPoint = {
  lat: number;
  lng: number;
  price: number;
  area: number;
  bedrooms: number;
  propertyType: string;
  neighborhood: string;
};

export type Filters = {
  priceRange: [number, number];
  areaRange: [number, number];
  propertyTypes: ReadonlySet<string>;
  bedroomBuckets: ReadonlySet<number>; // 1, 2, 3, 4 (where 4 means "4+")
  neighborhoods: ReadonlySet<string>;
};

const H3_RESOLUTION = 9;
const FIT_DEBOUNCE_MS = 300;

function aggregateToHexes(points: DealPoint[], res: number): HexAggregate[] {
  const buckets = new Map<string, { count: number; sum: number }>();
  for (const p of points) {
    const cell = latLngToCell(p.lat, p.lng, res);
    const b = buckets.get(cell);
    if (b) {
      b.count++;
      b.sum += p.price;
    } else {
      buckets.set(cell, { count: 1, sum: p.price });
    }
  }
  return Array.from(buckets, ([hex, b]) => ({
    hex,
    count: b.count,
    avgPrice: Math.round(b.sum / b.count),
  }));
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

export function DealsExplorer({ points }: { points: DealPoint[] }) {
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
  const [neighborhoods, setNeighborhoods] = useState<ReadonlySet<string>>(new Set());

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
      if (neighborhoods.size > 0 && !neighborhoods.has(p.neighborhood)) return false;
      return true;
    });
  }, [points, priceRange, areaRange, propertyTypes, bedroomBuckets, neighborhoods]);

  const hexes = useMemo(() => aggregateToHexes(filtered, H3_RESOLUTION), [filtered]);

  // ── Auto-fit bounds (debounced so slider drags don't trigger animation chaos)
  const [debouncedFiltered, setDebouncedFiltered] = useState(filtered);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFiltered(filtered), FIT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filtered]);

  const fitBounds = useMemo(() => computeBounds(debouncedFiltered), [debouncedFiltered]);

  return (
    <main className="flex-1 flex flex-col md:flex-row min-h-0">
      <FilterPanel
        total={points.length}
        matched={filtered.length}
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
        allNeighborhoods={allNeighborhoods}
        neighborhoods={neighborhoods}
        onNeighborhoodsChange={setNeighborhoods}
      />
      <section className="relative flex-1 min-h-[60vh] md:min-h-0">
        <MapView hexes={hexes} fitBounds={fitBounds} />
      </section>
    </main>
  );
}
