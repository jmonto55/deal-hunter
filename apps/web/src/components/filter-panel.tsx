"use client";

import { useEffect, useState, type ReactNode } from "react";
import AutoHeight from "embla-carousel-auto-height";
import { X } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { PriceRangeFilter } from "@/components/price-range-filter";
import { AreaRangeFilter } from "@/components/area-range-filter";
import { Chip } from "@/components/ui/chip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { LayerVisibility } from "@/components/map-view";

/** Map property-type enum values to their translation keys. */
const PROPERTY_TYPE_KEY: Record<string, MessageKey> = {
  apartamento: "propertyType.apartamento",
  casa: "propertyType.casa",
  apartaestudio: "propertyType.apartaestudio",
  penthouse: "propertyType.penthouse",
  lote: "propertyType.lote",
  oficina: "propertyType.oficina",
  local: "propertyType.local",
  bodega: "propertyType.bodega",
  finca: "propertyType.finca",
  casa_campestre: "propertyType.casaCampestre",
};

function toggleSet<T>(prev: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(prev);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

type FilterCard = { key: string; label: string; node: ReactNode; headerExtra?: ReactNode };

export function FilterPanel(props: {
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
  bathroomBuckets: ReadonlySet<number>;
  onBathroomBucketsChange: (next: ReadonlySet<number>) => void;
  bathroomOptions: readonly number[];
  allNeighborhoods: string[];
  neighborhoods: ReadonlySet<string>;
  onNeighborhoodsChange: (next: ReadonlySet<string>) => void;
  minDiscount: number;
  onMinDiscountChange: (next: number) => void;
  layerVisibility: LayerVisibility;
  onLayerVisibilityChange: (next: LayerVisibility) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  const {
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
    bathroomBuckets,
    onBathroomBucketsChange,
    bathroomOptions,
    allNeighborhoods,
    neighborhoods,
    onNeighborhoodsChange,
    minDiscount,
    onMinDiscountChange,
    layerVisibility,
    onLayerVisibilityChange,
    hasActiveFilters,
    onReset,
  } = props;

  const { t } = useLocale();

  // ── Reusable filter section nodes ────────────────────────────────────────
  const priceNode = (
    <PriceRangeFilter
      min={priceMin}
      max={priceMax}
      value={priceRange}
      onChange={onPriceRangeChange}
    />
  );

  const areaNode = (
    <AreaRangeFilter
      min={areaMin}
      max={areaMax}
      value={areaRange}
      onChange={onAreaRangeChange}
    />
  );

  const propertyTypeNode = (
    <div className="flex flex-wrap gap-2">
      {allPropertyTypes.map((type) => (
        <Chip
          key={type}
          selected={propertyTypes.has(type)}
          onClick={() => onPropertyTypesChange(toggleSet(propertyTypes, type))}
        >
          {PROPERTY_TYPE_KEY[type] ? t(PROPERTY_TYPE_KEY[type]!) : type}
        </Chip>
      ))}
    </div>
  );

  const bedroomsChips = (
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
  );

  const bathroomsChips = (
    <div className="flex flex-wrap gap-2">
      {bathroomOptions.map((n) => (
        <Chip
          key={n}
          selected={bathroomBuckets.has(n)}
          onClick={() => onBathroomBucketsChange(toggleSet(bathroomBuckets, n))}
        >
          {n === 4 ? "4+" : String(n)}
        </Chip>
      ))}
    </div>
  );

  const neighborhoodNode = (
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
  );

  const neighborhoodLabel =
    neighborhoods.size > 0
      ? `${t("filter.neighborhood")} (${neighborhoods.size})`
      : t("filter.neighborhood");

  const discountNode = (
    <div className="space-y-3">
      <Slider
        min={-10}
        max={30}
        step={1}
        value={[minDiscount]}
        onValueChange={([v]) => onMinDiscountChange(v!)}
      />
      <div className="flex justify-between text-label text-fg-muted">
        <span>
          {minDiscount <= -10
            ? t("filter.discountAny")
            : `≥${minDiscount >= 0 ? "+" : ""}${minDiscount}%`}
        </span>
        <span>+30%</span>
      </div>
    </div>
  );

  const layersNode = (
    <div className="space-y-3">
      <LayerToggle
        label={t("filter.layerDiscount")}
        checked={layerVisibility.discount}
        onCheckedChange={(v) => onLayerVisibilityChange({ ...layerVisibility, discount: v })}
        gradient="linear-gradient(to right, #FF5A5A 0%, #DC826E 25%, #B4B2A9 50%, #64DCB4 75%, #28E696 100%)"
        minLabel={t("legend.overMarket")}
        maxLabel={t("legend.belowMarket")}
      />
    </div>
  );

  const discountInfoButton = <InfoPopover text={t("filter.discountInfoText")} />;

  // Desktop has bedrooms and bathrooms as two separate cards.
  const desktopCards: FilterCard[] = [
    { key: "price", label: t("filter.price"), node: priceNode },
    { key: "area", label: t("filter.area"), node: areaNode },
    { key: "discount", label: t("filter.discount"), node: discountNode, headerExtra: discountInfoButton },
    { key: "property-type", label: t("filter.propertyType"), node: propertyTypeNode },
    { key: "bedrooms", label: t("filter.bedrooms"), node: bedroomsChips },
    { key: "bathrooms", label: t("filter.bathrooms"), node: bathroomsChips },
    { key: "neighborhood", label: neighborhoodLabel, node: neighborhoodNode },
    { key: "layers", label: t("filter.layers"), node: layersNode },
  ];

  // Mobile combines bedrooms + bathrooms into one carousel card.
  const mobileCards: FilterCard[] = [
    { key: "price", label: t("filter.price"), node: priceNode },
    { key: "area", label: t("filter.area"), node: areaNode },
    { key: "discount", label: t("filter.discount"), node: discountNode, headerExtra: discountInfoButton },
    { key: "property-type", label: t("filter.propertyType"), node: propertyTypeNode },
    {
      key: "rooms",
      label: t("filter.rooms"),
      node: (
        <div className="space-y-5">
          <SubSection label={t("filter.bedrooms")}>{bedroomsChips}</SubSection>
          <SubSection label={t("filter.bathrooms")}>{bathroomsChips}</SubSection>
        </div>
      ),
    },
    { key: "neighborhood", label: neighborhoodLabel, node: neighborhoodNode },
    { key: "layers", label: t("filter.layers"), node: layersNode },
  ];

  return (
    <aside
      className="
        w-full md:w-80 lg:w-96 shrink-0
        border-b md:border-b-0 md:border-r border-border
        bg-bg-card
      "
    >
      {/* Mobile: tab strip + horizontal carousel. The page heading lives
       * above the map on mobile (see DealsExplorer) so it stays at the top
       * of the viewport when filters move below the map. */}
      <div className="md:hidden p-4">
        <MobileFilterCarousel
          cards={mobileCards}
          hasActiveFilters={hasActiveFilters}
          onReset={onReset}
        />
      </div>

      {/* Desktop: vertical stack (heading lives above the heatmap legend
       * in DealsExplorer so it sits over the map column). */}
      <div className="hidden md:block p-5 md:max-h-[calc(100vh-3.5rem)] md:overflow-y-auto">
        <div className="space-y-4">
          {hasActiveFilters && (
            <div className="flex justify-end">
              <ResetButton onReset={onReset} />
            </div>
          )}
          {desktopCards.map((card) => (
            <FilterCardLayout key={card.key} label={card.label} headerExtra={card.headerExtra}>
              {card.node}
            </FilterCardLayout>
          ))}
        </div>
      </div>
    </aside>
  );
}

/**
 * Mobile carousel with a tab strip for navigation. Tabs reuse the same
 * neumorphic pressed-in pattern as the Chip primitive (raised pill at rest,
 * pressed-in with action-blue text when selected) so the active state pulls
 * from the design system instead of inventing a new filled-pill treatment.
 */
function MobileFilterCarousel({
  cards,
  hasActiveFilters,
  onReset,
}: {
  cards: FilterCard[];
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  const { t } = useLocale();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <div className="space-y-4">
      <nav
        className="flex gap-2 overflow-x-auto -mx-1 px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t("panel.tabsAria")}
      >
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            aria-label={t("filter.resetAria")}
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-label font-medium whitespace-nowrap transition-all duration-150 bg-bg-base text-fg-muted hover:text-fg",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40",
            )}
            style={{ boxShadow: "var(--shadow-neu-sm)" }}
          >
            <X className="size-3.5" aria-hidden="true" />
            {t("filter.reset")}
          </button>
        )}
        {cards.map((card, i) => {
          const selected = current === i;
          return (
            <button
              key={card.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "shrink-0 inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-label font-medium whitespace-nowrap transition-all duration-150 bg-bg-base",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40",
                selected ? "text-action" : "text-fg-muted hover:text-fg",
              )}
              style={{
                boxShadow: selected
                  ? "var(--shadow-neu-pressed)"
                  : "var(--shadow-neu-sm)",
              }}
            >
              {card.label}
            </button>
          );
        })}
      </nav>
      <Carousel
        opts={{ align: "start", watchDrag: false }}
        plugins={[AutoHeight()]}
        setApi={setApi}
      >
        {/* AutoHeight resizes the viewport to match the active slide so a
         * short card (Precio) doesn't reserve a chip-wall card's worth of
         * empty space below it. */}
        <CarouselContent className="items-start transition-[height] duration-200">
          {cards.map((card) => (
            <CarouselItem key={card.key}>
              <FilterCardLayout label={card.label} headerExtra={card.headerExtra}>
                {card.node}
              </FilterCardLayout>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

/**
 * Filter card — neumorphic raised surface with a small label header. The
 * `flex flex-col justify-center` pattern centers content vertically when the
 * carousel stretches all slides to the tallest one's height (so a short card
 * doesn't stick to the top of an oversized slide).
 */
function FilterCardLayout({
  label,
  headerExtra,
  children,
}: {
  label: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-[var(--radius-neu)] p-4 bg-bg-base"
      style={{ boxShadow: "var(--shadow-neu-sm)" }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex-1 text-label font-medium uppercase tracking-wide text-fg-muted">
          {label}
        </div>
        {headerExtra}
      </div>
      {children}
    </div>
  );
}

/** Sub-section header inside a combined card (e.g. Habitaciones / Baños). */
function SubSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-label font-medium text-fg-muted">{label}</div>
      {children}
    </div>
  );
}

function LayerToggle({
  label,
  checked,
  onCheckedChange,
  gradient,
  minLabel,
  maxLabel,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  gradient: string;
  minLabel?: string;
  maxLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <div className="flex-1 space-y-1.5">
        <div className="text-label font-medium text-fg leading-none">{label}</div>
        <div
          className="h-2 w-full rounded-full"
          style={{ background: gradient, opacity: checked ? 1 : 0.3 }}
        />
        {(minLabel || maxLabel) && (
          <div className="flex justify-between" style={{ fontSize: 10, opacity: checked ? 1 : 0.5 }}>
            {minLabel && <span style={{ color: "#FF5A5A" }}>{minLabel}</span>}
            {maxLabel && <span style={{ color: "#28E696" }}>{maxLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Desktop reset button — neumorphic pill, mirrors the mobile reset chip. */
function ResetButton({ onReset }: { onReset: () => void }) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onReset}
      aria-label={t("filter.resetAria")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-label font-medium bg-bg-base text-fg-muted hover:text-fg transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40",
      )}
      style={{ boxShadow: "var(--shadow-neu-sm)" }}
    >
      <X className="size-3.5" aria-hidden="true" />
      {t("filter.resetLong")}
    </button>
  );
}
