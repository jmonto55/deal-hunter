"use client";

import { PriceRangeFilter } from "@/components/price-range-filter";
import { AreaRangeFilter } from "@/components/area-range-filter";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { DENSITY_STOPS, PRICE_STOPS, type LayerVisibility } from "@/components/map-view";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  apartaestudio: "Apartaestudio",
  penthouse: "Penthouse",
  lote: "Lote",
  oficina: "Oficina",
  local: "Local",
  bodega: "Bodega",
  finca: "Finca",
  casa_campestre: "Casa campestre",
};

function toggleSet<T>(prev: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(prev);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function formatCOPShort(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

function stopsToCssGradient(stops: Array<[number, [number, number, number, number]]>) {
  // Solid colors (alpha=1) for the legend so the bar reads cleanly even
  // when the layer's actual rendering uses lower alpha for blending.
  return stops
    .map(([t, [r, g, b]]) => `rgb(${r}, ${g}, ${b}) ${t * 100}%`)
    .join(", ");
}

export function FilterPanel({
  total,
  matched,
  priceMin,
  priceMax,
  priceRange,
  onPriceRangeChange,
  areaMin,
  areaMax,
  areaRange,
  onAreaRangeChange,
  allPropertyTypes,
  propertyTypes,
  onPropertyTypesChange,
  bedroomBuckets,
  onBedroomBucketsChange,
  bedroomOptions,
  allNeighborhoods,
  neighborhoods,
  onNeighborhoodsChange,
  layerVisibility,
  onLayerVisibilityChange,
}: {
  total: number;
  matched: number;
  priceMin: number;
  priceMax: number;
  priceRange: [number, number];
  onPriceRangeChange: (next: [number, number]) => void;
  areaMin: number;
  areaMax: number;
  areaRange: [number, number];
  onAreaRangeChange: (next: [number, number]) => void;
  allPropertyTypes: string[];
  propertyTypes: ReadonlySet<string>;
  onPropertyTypesChange: (next: ReadonlySet<string>) => void;
  bedroomBuckets: ReadonlySet<number>;
  onBedroomBucketsChange: (next: ReadonlySet<number>) => void;
  bedroomOptions: readonly number[];
  allNeighborhoods: string[];
  neighborhoods: ReadonlySet<string>;
  onNeighborhoodsChange: (next: ReadonlySet<string>) => void;
  layerVisibility: LayerVisibility;
  onLayerVisibilityChange: (next: LayerVisibility) => void;
}) {
  return (
    <aside
      className="
        w-full md:w-80 lg:w-96 shrink-0
        border-b md:border-b-0 md:border-r border-border
        bg-bg-card
        p-6
        md:max-h-[calc(100vh-3.5rem)] md:overflow-y-auto
      "
    >
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-h3 font-semibold text-fg">Medellín Properties</h2>
          <p className="text-label text-fg-muted">
            <span className="text-fg font-semibold">{matched.toLocaleString()}</span>
            {" of "}
            <span className="text-fg font-semibold">{total.toLocaleString()}</span>
            {" properties match filters"}
          </p>
        </header>

        <Card>
          <Section label="Layers">
            <LayerToggle
              label="Density"
              description="More properties per area"
              checked={layerVisibility.density}
              onCheckedChange={(c) =>
                onLayerVisibilityChange({ ...layerVisibility, density: c })
              }
              gradient={stopsToCssGradient(DENSITY_STOPS)}
              minLabel="Sparse"
              maxLabel="Dense"
            />
            <LayerToggle
              label="Price"
              description="Average price per area"
              checked={layerVisibility.price}
              onCheckedChange={(c) =>
                onLayerVisibilityChange({ ...layerVisibility, price: c })
              }
              gradient={stopsToCssGradient(PRICE_STOPS)}
              minLabel={formatCOPShort(priceMin)}
              maxLabel={formatCOPShort(priceMax)}
            />
          </Section>
        </Card>

        <Card>
          <PriceRangeFilter
            min={priceMin}
            max={priceMax}
            value={priceRange}
            onChange={onPriceRangeChange}
          />
        </Card>

        <Card>
          <AreaRangeFilter
            min={areaMin}
            max={areaMax}
            value={areaRange}
            onChange={onAreaRangeChange}
          />
        </Card>

        <Section label="Property type">
          <div className="flex flex-wrap gap-2">
            {allPropertyTypes.map((t) => (
              <Chip
                key={t}
                selected={propertyTypes.has(t)}
                onClick={() => onPropertyTypesChange(toggleSet(propertyTypes, t))}
              >
                {PROPERTY_TYPE_LABELS[t] ?? t}
              </Chip>
            ))}
          </div>
        </Section>

        <Section label="Bedrooms">
          <div className="flex flex-wrap gap-2">
            {bedroomOptions.map((n) => (
              <Chip
                key={n}
                selected={bedroomBuckets.has(n)}
                onClick={() => onBedroomBucketsChange(toggleSet(bedroomBuckets, n))}
              >
                {n === 4 ? "4+" : String(n)}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          label="Neighborhood"
          count={neighborhoods.size > 0 ? neighborhoods.size : undefined}
        >
          <div className="flex flex-wrap gap-2">
            {allNeighborhoods.map((n) => (
              <Chip
                key={n}
                selected={neighborhoods.has(n)}
                onClick={() => onNeighborhoodsChange(toggleSet(neighborhoods, n))}
              >
                {n}
              </Chip>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-neu)] p-5 bg-bg-base"
      style={{ boxShadow: "var(--shadow-neu-sm)" }}
    >
      {children}
    </div>
  );
}

function Section({
  label,
  count,
  children,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-label font-medium uppercase tracking-wide text-fg-muted">
        {label}
        {count !== undefined && (
          <span className="ml-1.5 text-fg-subtle">({count})</span>
        )}
      </label>
      {children}
    </div>
  );
}

function LayerToggle({
  label,
  description,
  checked,
  onCheckedChange,
  gradient,
  minLabel,
  maxLabel,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  gradient: string;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-body font-semibold text-fg">{label}</div>
          <div className="text-label text-fg-subtle truncate">{description}</div>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={`Toggle ${label} layer`}
        />
      </div>
      <div className={checked ? "" : "opacity-40"}>
        <div
          className="h-2 rounded-full"
          style={{ background: `linear-gradient(to right, ${gradient})` }}
        />
        <div className="mt-1.5 flex justify-between text-label text-fg-subtle">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    </div>
  );
}
