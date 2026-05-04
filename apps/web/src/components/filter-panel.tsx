"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import AutoHeight from "embla-carousel-auto-height";
import { X } from "lucide-react";
import { PriceRangeFilter } from "@/components/price-range-filter";
import { AreaRangeFilter } from "@/components/area-range-filter";
import { Chip } from "@/components/ui/chip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";

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

type FilterCard = { key: string; label: string; node: ReactNode };

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
  allCities: string[];
  cities: ReadonlySet<string>;
  onCitiesChange: (next: ReadonlySet<string>) => void;
  allCommunes: string[];
  communes: ReadonlySet<string>;
  onCommunesChange: (next: ReadonlySet<string>) => void;
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
    allCities,
    cities,
    onCitiesChange,
    allCommunes,
    communes,
    onCommunesChange,
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

  // ── Hierarchical location filter ─────────────────────────────────────────
  const municipalityLabel =
    cities.size > 0
      ? `${t("filter.municipality")} (${cities.size})`
      : t("filter.municipality");

  const communeLabel =
    communes.size > 0
      ? `${t("filter.commune")} (${communes.size})`
      : t("filter.commune");

  const municipalityNode = (
    <div className="flex flex-wrap gap-2">
      {allCities.map((city) => (
        <Chip
          key={city}
          selected={cities.has(city)}
          onClick={() => onCitiesChange(toggleSet(cities, city))}
        >
          {city}
        </Chip>
      ))}
    </div>
  );

  const communeNode = (
    <div className="flex flex-wrap gap-2">
      {allCommunes.map((commune) => (
        <Chip
          key={commune}
          selected={communes.has(commune)}
          onClick={() => onCommunesChange(toggleSet(communes, commune))}
        >
          {commune}
        </Chip>
      ))}
    </div>
  );

  // Commune card only appears when Medellín is selected
  const showCommune = cities.has("Medellín");

  // Desktop has bedrooms and bathrooms as two separate cards.
  const desktopCards: FilterCard[] = [
    { key: "price", label: t("filter.price"), node: priceNode },
    { key: "area", label: t("filter.area"), node: areaNode },
    { key: "property-type", label: t("filter.propertyType"), node: propertyTypeNode },
    { key: "bedrooms", label: t("filter.bedrooms"), node: bedroomsChips },
    { key: "bathrooms", label: t("filter.bathrooms"), node: bathroomsChips },
    { key: "municipality", label: municipalityLabel, node: municipalityNode },
    ...(showCommune
      ? [{ key: "commune", label: communeLabel, node: communeNode }]
      : []),
  ];

  // Mobile combines bedrooms + bathrooms into one carousel card.
  const mobileCards: FilterCard[] = [
    { key: "price", label: t("filter.price"), node: priceNode },
    { key: "area", label: t("filter.area"), node: areaNode },
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
    { key: "municipality", label: municipalityLabel, node: municipalityNode },
    ...(showCommune
      ? [{ key: "commune", label: communeLabel, node: communeNode }]
      : []),
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
            <FilterCardLayout key={card.key} label={card.label}>
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
  const prevLengthRef = useRef(cards.length);

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

  // When a card is added/removed (commune card appearing/disappearing),
  // snap back to 0 so the index never points at a non-existent slide.
  useEffect(() => {
    if (prevLengthRef.current !== cards.length) {
      prevLengthRef.current = cards.length;
      api?.scrollTo(0);
      setCurrent(0);
    }
  }, [cards.length, api]);

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
              <FilterCardLayout label={card.label}>{card.node}</FilterCardLayout>
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
function FilterCardLayout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-neu)] p-4 bg-bg-base"
      style={{ boxShadow: "var(--shadow-neu-sm)" }}
    >
      <div className="text-label font-medium uppercase tracking-wide text-fg-muted mb-3">
        {label}
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
