"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bath,
  BedDouble,
  BarChart2,
  Building2,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  MapPin,
  Receipt,
  Ruler,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { DealPoint } from "@/components/deals-explorer";

// A photo set is an ordered list of paths; index 0 = hero (bento large slot).
// Sorted best→rest by file size so the most impressive shot leads.
// The bento shows only the first three; the gallery shows all of them.
type PhotoSet = readonly string[];

const PHOTO_SETS: readonly PhotoSet[] = [
  // set-1 — 13 photos (6 jpg + 7 webp)
  [
    "/properties/set-1/photo-1.jpg",
    "/properties/set-1/photo-2.jpg",
    "/properties/set-1/photo-3.jpg",
    "/properties/set-1/photo-4.jpg",
    "/properties/set-1/photo-5.jpg",
    "/properties/set-1/photo-6.jpg",
    "/properties/set-1/photo-7.webp",
    "/properties/set-1/photo-8.webp",
    "/properties/set-1/photo-9.webp",
    "/properties/set-1/photo-10.webp",
    "/properties/set-1/photo-11.webp",
    "/properties/set-1/photo-12.webp",
    "/properties/set-1/photo-13.webp",
  ],
  // set-2 — 12 photos (all webp)
  [
    "/properties/set-2/photo-1.webp",
    "/properties/set-2/photo-2.webp",
    "/properties/set-2/photo-3.webp",
    "/properties/set-2/photo-4.webp",
    "/properties/set-2/photo-5.webp",
    "/properties/set-2/photo-6.webp",
    "/properties/set-2/photo-7.webp",
    "/properties/set-2/photo-8.webp",
    "/properties/set-2/photo-9.webp",
    "/properties/set-2/photo-10.webp",
    "/properties/set-2/photo-11.webp",
    "/properties/set-2/photo-12.webp",
  ],
  // set-3 — 9 photos (all webp)
  [
    "/properties/set-3/photo-1.webp",
    "/properties/set-3/photo-2.webp",
    "/properties/set-3/photo-3.webp",
    "/properties/set-3/photo-4.webp",
    "/properties/set-3/photo-5.webp",
    "/properties/set-3/photo-6.webp",
    "/properties/set-3/photo-7.webp",
    "/properties/set-3/photo-8.webp",
    "/properties/set-3/photo-9.webp",
  ],
  // set-4 — 14 photos (12 jpg + 2 webp)
  [
    "/properties/set-4/photo-1.jpg",
    "/properties/set-4/photo-2.jpg",
    "/properties/set-4/photo-3.jpg",
    "/properties/set-4/photo-4.jpg",
    "/properties/set-4/photo-5.jpg",
    "/properties/set-4/photo-6.jpg",
    "/properties/set-4/photo-7.jpg",
    "/properties/set-4/photo-8.jpg",
    "/properties/set-4/photo-9.jpg",
    "/properties/set-4/photo-10.jpg",
    "/properties/set-4/photo-11.jpg",
    "/properties/set-4/photo-12.jpg",
    "/properties/set-4/photo-13.webp",
    "/properties/set-4/photo-14.webp",
  ],
  // set-5 — 13 photos (all webp)
  [
    "/properties/set-5/photo-1.webp",
    "/properties/set-5/photo-2.webp",
    "/properties/set-5/photo-3.webp",
    "/properties/set-5/photo-4.webp",
    "/properties/set-5/photo-5.webp",
    "/properties/set-5/photo-6.webp",
    "/properties/set-5/photo-7.webp",
    "/properties/set-5/photo-8.webp",
    "/properties/set-5/photo-9.webp",
    "/properties/set-5/photo-10.webp",
    "/properties/set-5/photo-11.webp",
    "/properties/set-5/photo-12.webp",
    "/properties/set-5/photo-13.webp",
  ],
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
  // Returns the full photo array for the property; caller slices [0..2] for
  // the bento and passes the whole array to the gallery.
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
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  // Escape: close the gallery first if it's open; otherwise close the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (galleryIndex !== null) setGalleryIndex(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, galleryIndex]);

  const typeLabel = PROPERTY_TYPE_KEY[property.propertyType]
    ? t(PROPERTY_TYPE_KEY[property.propertyType]!)
    : property.propertyType;

  // "El Poblado, Medellín" for Medellín rows; just "Envigado" for others
  const location = property.commune
    ? `${property.commune}, ${property.city}`
    : property.city;

  const extras = useMemo(() => pseudoExtras(property), [property]);
  const photoSet = useMemo(() => pickPhotoSet(property), [property]);
  const pricePerM2 = Math.round(property.price / Math.max(1, property.area));

  const analysisHref = `/analysis?${new URLSearchParams({
    price: String(property.price),
    area: String(property.area),
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    neighborhood: property.neighborhood,
    type: property.propertyType,
  }).toString()}`;

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
              src={photoSet[0]}
              alt=""
              onClick={() => setGalleryIndex(0)}
              className="w-full h-48 object-cover rounded-t-[var(--radius-neu)] cursor-pointer"
            />
            <DrawerActions
                onClose={onClose}
                closeLabel={t("drawer.closeAria")}
                analysisLabel={t("drawer.analysisAria")}
                analysisHref={analysisHref}
              />
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
            <DrawerActions
                onClose={onClose}
                closeLabel={t("drawer.closeAria")}
                analysisLabel={t("drawer.analysisAria")}
                analysisHref={analysisHref}
              />
          </div>

          {/* Bento: 12-col grid, mixed tile sizes. */}
          <div className="grid grid-cols-12 gap-3">
            {/* Photo collage — left, spans 7 cols, 2 rows tall. */}
            <div className="col-span-7 row-span-2 grid grid-cols-2 grid-rows-2 gap-1.5 h-80 rounded-[var(--radius-neu)] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSet[0]}
                alt=""
                onClick={() => setGalleryIndex(0)}
                className="row-span-2 w-full h-full object-cover cursor-pointer hover:brightness-90 transition-[filter] duration-150"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSet[1]}
                alt=""
                onClick={() => setGalleryIndex(1)}
                className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-[filter] duration-150"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSet[2]}
                alt=""
                onClick={() => setGalleryIndex(2)}
                className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-[filter] duration-150"
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

      {galleryIndex !== null && (
        <PhotoGallery
          photos={photoSet}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </>
  );
}

/** Full-screen photo gallery lightbox. Keyboard: ← → to navigate, Esc to close. */
function PhotoGallery({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: readonly string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) onIndexChange(index + 1);
      // Escape is handled by the drawer's useEffect so the gallery closes first.
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, photos.length, onIndexChange]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar galería"
        className="absolute top-4 right-4 z-10 flex items-center justify-center size-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="size-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm tabular-nums select-none">
        {index + 1} / {photos.length}
      </div>

      {/* Prev button */}
      {index > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }}
          aria-label="Foto anterior"
          className="absolute left-4 flex items-center justify-center size-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* Photo — stopPropagation so clicking the image doesn't close the gallery */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg select-none"
        draggable={false}
      />

      {/* Next button */}
      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }}
          aria-label="Siguiente foto"
          className="absolute right-4 flex items-center justify-center size-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => { e.stopPropagation(); onIndexChange(i); }}
            aria-label={`Foto ${i + 1}`}
            className={`size-2 rounded-full transition-colors ${
              i === index ? "bg-white" : "bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
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

function DrawerActions({
  onClose,
  closeLabel,
  analysisLabel,
  analysisHref,
}: {
  onClose: () => void;
  closeLabel: string;
  analysisLabel: string;
  analysisHref: string;
}) {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
      <Button
        variant="outline"
        size="icon-sm"
        asChild
        className="rounded-full bg-bg-card/95"
        aria-label={analysisLabel}
      >
        <Link href={analysisHref}>
          <BarChart2 />
        </Link>
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onClose}
        aria-label={closeLabel}
        className="rounded-full bg-bg-card/95"
      >
        <X />
      </Button>
    </div>
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
