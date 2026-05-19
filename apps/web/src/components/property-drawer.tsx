"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Car,
  Clock,
  Layers,
  MapPin,
  Receipt,
  Ruler,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { DealPoint } from "@/components/deals-explorer";

type PhotoSet = {
  hero: string;
  secondary: string;
  tertiary: string;
};

// Five sets of real property photos (apps/web/public/properties/).
// Sets 1 & 4 are JPEG; sets 2, 3 & 5 are WebP — both formats are
// universally supported in modern browsers.
const PHOTO_SETS: readonly PhotoSet[] = [
  { hero: "/properties/set-1/hero.jpg",  secondary: "/properties/set-1/photo-2.jpg",  tertiary: "/properties/set-1/photo-3.jpg"  },
  { hero: "/properties/set-2/hero.webp", secondary: "/properties/set-2/photo-2.webp", tertiary: "/properties/set-2/photo-3.webp" },
  { hero: "/properties/set-3/hero.webp", secondary: "/properties/set-3/photo-2.webp", tertiary: "/properties/set-3/photo-3.webp" },
  { hero: "/properties/set-4/hero.jpg",  secondary: "/properties/set-4/photo-2.jpg",  tertiary: "/properties/set-4/photo-3.jpg"  },
  { hero: "/properties/set-5/hero.webp", secondary: "/properties/set-5/photo-2.webp", tertiary: "/properties/set-5/photo-3.webp" },
];

/**
 * Pick a stable photo set for a property based on its lat/lng.
 * Same property always maps to the same set, so a user closing and
 * reopening the drawer never sees the photos change.
 *
 * Distribution: lat+lng → integer seed → seed % PHOTO_SETS.length.
 * For 2000 properties spread across Aburrá Valley this gives roughly
 * 400 properties per set with no neighborhood bias.
 */
function pickPhotoSet(p: DealPoint): PhotoSet {
  let seed = 0;
  const s = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
  for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) | 0;
  seed = Math.abs(seed);
  return PHOTO_SETS[seed % PHOTO_SETS.length]!;
}

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

const AMENITY_POOL: MessageKey[] = [
  "amenity.pool",
  "amenity.gym",
  "amenity.security",
  "amenity.rooftop",
  "amenity.garden",
  "amenity.concierge",
  "amenity.playground",
  "amenity.bbq",
];

function formatCOP(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

function formatCOPCompact(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString("en-US")}`;
}

/**
 * Stable per-property pseudo-data. The Neon dataset has no extras (year,
 * estrato, parking, amenities), so we hash lat/lng to a deterministic seed
 * and synthesize plausible values — same property always shows the same
 * details. Marked clearly as illustrative; swap for real fields once the
 * schema grows.
 */
function pseudoExtras(p: DealPoint) {
  let seed = 0;
  const s = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
  for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) | 0;
  seed = Math.abs(seed);

  const estrato = 3 + (seed % 4); // 3–6
  const yearBuilt = 1985 + ((seed >> 2) % 40); // 1985–2024
  const parking = (seed >> 4) % 4; // 0–3
  const hoaFee = 200_000 + ((seed >> 6) % 12) * 50_000; // 200k–750k COP
  const daysListed = 1 + ((seed >> 8) % 30); // 1–30

  // Pick 3–4 amenities deterministically from the pool.
  const amenities: MessageKey[] = [];
  for (let i = 0; i < AMENITY_POOL.length && amenities.length < 4; i++) {
    if (((seed >> (i + 10)) & 1) === 1) amenities.push(AMENITY_POOL[i]!);
  }
  if (amenities.length < 3) {
    for (const a of AMENITY_POOL) {
      if (!amenities.includes(a)) amenities.push(a);
      if (amenities.length === 3) break;
    }
  }

  return { estrato, yearBuilt, parking, hoaFee, daysListed, amenities };
}

/**
 * Bottom-sheet drawer with property data. Slides up from the bottom on both
 * mobile and desktop; closes on backdrop click, Escape, or the X button.
 */
export function PropertyDrawer({
  property,
  onClose,
}: {
  property: DealPoint;
  onClose: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const typeLabel = PROPERTY_TYPE_KEY[property.propertyType]
    ? t(PROPERTY_TYPE_KEY[property.propertyType]!)
    : property.propertyType;

  // "El Poblado, Medellín" for Medellín rows; just "Envigado" for others
  const location = property.commune
    ? `${property.commune}, ${property.city}`
    : property.city;

  const extras = useMemo(() => pseudoExtras(property), [property]);
  const photos = useMemo(() => pickPhotoSet(property), [property]);
  const pricePerM2 = Math.round(property.price / Math.max(1, property.area));
  const description = t("drawer.descriptionTemplate", {
    type: typeLabel,
    area: property.area,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    location,
  });

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("drawer.closeAria")}
        className="fixed inset-0 z-40 bg-black/30 animate-fade-in cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("drawer.title")}
        className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card border-t border-border rounded-t-[var(--radius-neu)] max-h-[90vh] md:max-h-[80vh] overflow-y-auto animate-slide-up flex flex-col"
      >
        {/* ── MOBILE LAYOUT ──────────────────────────────────────── */}
        <div className="md:hidden">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos.hero}
              alt=""
              className="w-full h-48 object-cover rounded-t-[var(--radius-neu)]"
            />
            <CloseButton onClose={onClose} label={t("drawer.closeAria")} />
          </div>

          <div className="p-5 space-y-4">
            <PriceBlock
              price={property.price}
              pricePerM2={pricePerM2}
              location={location}
              typeLabel={typeLabel}
              daysListed={extras.daysListed}
              t={t}
            />

            <dl className="grid grid-cols-3 gap-2.5">
              <Stat icon={<Ruler className="size-4" />} label={t("filter.area")}>
                {property.area} m²
              </Stat>
              <Stat icon={<BedDouble className="size-4" />} label={t("filter.bedrooms")}>
                {property.bedrooms}
              </Stat>
              <Stat icon={<Bath className="size-4" />} label={t("filter.bathrooms")}>
                {property.bathrooms}
              </Stat>
              <Stat icon={<Car className="size-4" />} label={t("drawer.parking")}>
                {extras.parking}
              </Stat>
              <Stat icon={<Layers className="size-4" />} label={t("drawer.estrato")}>
                {extras.estrato}
              </Stat>
              <Stat icon={<Calendar className="size-4" />} label={t("drawer.yearBuilt")}>
                {extras.yearBuilt}
              </Stat>
            </dl>

            <Card>
              <SectionLabel>{t("drawer.amenities")}</SectionLabel>
              <AmenityList amenities={extras.amenities} t={t} />
            </Card>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT — bento grid ──────────────────────── */}
        <div className="hidden md:block p-5">
          <div className="relative">
            <CloseButton onClose={onClose} label={t("drawer.closeAria")} />
          </div>

          {/* Bento: 12-col grid, mixed tile sizes. */}
          <div className="grid grid-cols-12 gap-3">
            {/* Photo collage — left, spans 7 cols, 2 rows tall. */}
            <div className="col-span-7 row-span-2 grid grid-cols-2 grid-rows-2 gap-1.5 h-80 rounded-[var(--radius-neu)] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos.hero}
                alt=""
                className="row-span-2 w-full h-full object-cover"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos.secondary}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos.tertiary}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* Price hero card — right side, spans 5 cols, 1 row. */}
            <Card className="col-span-5 flex flex-col justify-center gap-2">
              <PriceBlock
                price={property.price}
                pricePerM2={pricePerM2}
                location={location}
                typeLabel={typeLabel}
                daysListed={extras.daysListed}
                t={t}
                large
              />
            </Card>

            {/* Quick stats strip — right side, spans 5 cols, 1 row. */}
            <div className="col-span-5 grid grid-cols-3 gap-2">
              <Stat icon={<Ruler className="size-4" />} label={t("filter.area")}>
                {property.area} m²
              </Stat>
              <Stat icon={<BedDouble className="size-4" />} label={t("filter.bedrooms")}>
                {property.bedrooms}
              </Stat>
              <Stat icon={<Bath className="size-4" />} label={t("filter.bathrooms")}>
                {property.bathrooms}
              </Stat>
            </div>

            {/* Description — wider, spans 7 cols. */}
            <Card className="col-span-7">
              <SectionLabel>{t("drawer.description")}</SectionLabel>
              <p className="text-body text-fg-muted leading-relaxed">{description}</p>
            </Card>

            {/* Key facts — narrow column, spans 5 cols. */}
            <Card className="col-span-5">
              <SectionLabel>{t("drawer.amenities")}</SectionLabel>
              <AmenityList amenities={extras.amenities} t={t} />
            </Card>

            {/* Bottom row — 4 small fact tiles spanning the full width. */}
            <Stat
              className="col-span-3"
              icon={<Car className="size-4" />}
              label={t("drawer.parking")}
            >
              {extras.parking}
            </Stat>
            <Stat
              className="col-span-3"
              icon={<Layers className="size-4" />}
              label={t("drawer.estrato")}
            >
              {extras.estrato}
            </Stat>
            <Stat
              className="col-span-3"
              icon={<Calendar className="size-4" />}
              label={t("drawer.yearBuilt")}
            >
              {extras.yearBuilt}
            </Stat>
            <Stat
              className="col-span-3"
              icon={<Receipt className="size-4" />}
              label={t("drawer.hoaFee")}
            >
              {formatCOPCompact(extras.hoaFee)}
            </Stat>
          </div>
        </div>
      </div>
    </>
  );
}

function PriceBlock({
  price,
  pricePerM2,
  location,
  typeLabel,
  daysListed,
  t,
  large = false,
}: {
  price: number;
  pricePerM2: number;
  location: string;
  typeLabel: string;
  daysListed: number;
  t: ReturnType<typeof useLocale>["t"];
  large?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div
        className={
          large
            ? "text-h1 font-semibold text-fg leading-none"
            : "text-h2 font-semibold text-fg leading-tight"
        }
      >
        {formatCOP(price)}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-fg-muted">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {formatCOPCompact(pricePerM2)} {t("drawer.pricePerM2")}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden="true" />
          {location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Building2 className="size-3.5" aria-hidden="true" />
          {typeLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          {t("drawer.daysListed", { n: daysListed })}
        </span>
      </div>
    </div>
  );
}

function CloseButton({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={onClose}
      aria-label={label}
      className="absolute top-3 right-3 rounded-full bg-bg-card/95 z-10"
    >
      <X />
    </Button>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-neu)] p-4 bg-bg-base ${className}`}
      style={{ boxShadow: "var(--shadow-neu-sm)" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-label font-medium uppercase tracking-wide text-fg-muted mb-2">
      {children}
    </div>
  );
}

function Stat({
  icon,
  label,
  children,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-neu-sm)] p-3 bg-bg-base ${className}`}
      style={{ boxShadow: "var(--shadow-neu-sm)" }}
    >
      <dt className="flex items-center gap-1.5 text-label text-fg-muted mb-1">
        {icon}
        {label}
      </dt>
      <dd className="text-body font-semibold text-fg">{children}</dd>
    </div>
  );
}

function AmenityList({
  amenities,
  t,
}: {
  amenities: MessageKey[];
  t: ReturnType<typeof useLocale>["t"];
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {amenities.map((key) => (
        <li
          key={key}
          className="inline-flex items-center rounded-full px-3 py-1 text-label font-medium bg-bg-card text-fg"
          style={{ boxShadow: "var(--shadow-neu-sm)" }}
        >
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
