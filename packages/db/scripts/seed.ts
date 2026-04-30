/**
 * Seed `deals` with 2,000 realistic Medellín-area property listings.
 *
 * Distribution mirrors Fincaraiz/Metrocuadrado density: El Poblado dominates
 * volume + price; outer municipalities (Bello, Itagüí, Sabaneta) carry lower
 * prices and higher counts of mid-stratum apartments. Lat/lng are clustered
 * around each neighborhood's centroid with gaussian noise scaled by an
 * approximate radius.
 *
 * Reproducible: uses a Mulberry32 PRNG seeded with 42. Re-running produces
 * the same 2,000 rows. Run with `npm run db:seed` from packages/db.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { deals, type NewDeal } from "../src/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { casing: "snake_case" });

// ── PRNG (Mulberry32) ────────────────────────────────────────────────────
function makeRng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}
const rand = makeRng(42);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)]!;

function pickWeighted<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1]!.value;
}

// Box-Muller for gaussian noise (mean 0, std 1)
function gaussian() {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── Geographic distribution ──────────────────────────────────────────────
// Centroid coords approximate, weight ~ % of total listings on the major
// Colombian real-estate platforms, radius ≈ neighborhood half-extent in
// degrees (~111 km/deg, so 0.012 ≈ 1.3 km).
type Neighborhood = {
  name: string;
  commune: string;
  city: string;
  department: string;
  lat: number;
  lng: number;
  radius: number;
  weight: number;
  priceMin: number;
  priceMax: number;
  stratumMin: number;
  stratumMax: number;
};

const NEIGHBORHOODS: Neighborhood[] = [
  { name: "El Poblado", commune: "El Poblado", city: "Medellín", department: "Antioquia", lat: 6.2086, lng: -75.5695, radius: 0.014, weight: 26, priceMin: 500_000_000, priceMax: 2_500_000_000, stratumMin: 5, stratumMax: 6 },
  { name: "Envigado", commune: "Envigado", city: "Envigado", department: "Antioquia", lat: 6.1714, lng: -75.5894, radius: 0.018, weight: 13, priceMin: 350_000_000, priceMax: 1_800_000_000, stratumMin: 4, stratumMax: 6 },
  { name: "Laureles", commune: "Laureles-Estadio", city: "Medellín", department: "Antioquia", lat: 6.2462, lng: -75.5879, radius: 0.012, weight: 11, priceMin: 300_000_000, priceMax: 1_200_000_000, stratumMin: 4, stratumMax: 5 },
  { name: "Sabaneta", commune: "Sabaneta", city: "Sabaneta", department: "Antioquia", lat: 6.1517, lng: -75.6157, radius: 0.013, weight: 9, priceMin: 250_000_000, priceMax: 1_000_000_000, stratumMin: 3, stratumMax: 5 },
  { name: "Belén", commune: "Belén", city: "Medellín", department: "Antioquia", lat: 6.2316, lng: -75.6065, radius: 0.014, weight: 8, priceMin: 200_000_000, priceMax: 800_000_000, stratumMin: 3, stratumMax: 5 },
  { name: "Itagüí", commune: "Itagüí", city: "Itagüí", department: "Antioquia", lat: 6.17, lng: -75.6101, radius: 0.018, weight: 7, priceMin: 180_000_000, priceMax: 600_000_000, stratumMin: 2, stratumMax: 4 },
  { name: "Bello", commune: "Bello", city: "Bello", department: "Antioquia", lat: 6.3391, lng: -75.5589, radius: 0.022, weight: 7, priceMin: 130_000_000, priceMax: 500_000_000, stratumMin: 2, stratumMax: 4 },
  { name: "La Estrella", commune: "La Estrella", city: "La Estrella", department: "Antioquia", lat: 6.1467, lng: -75.6391, radius: 0.014, weight: 5, priceMin: 180_000_000, priceMax: 700_000_000, stratumMin: 3, stratumMax: 5 },
  { name: "Robledo", commune: "Robledo", city: "Medellín", department: "Antioquia", lat: 6.2799, lng: -75.6048, radius: 0.013, weight: 4, priceMin: 150_000_000, priceMax: 450_000_000, stratumMin: 2, stratumMax: 4 },
  { name: "Castilla", commune: "Castilla", city: "Medellín", department: "Antioquia", lat: 6.2782, lng: -75.5728, radius: 0.013, weight: 4, priceMin: 130_000_000, priceMax: 400_000_000, stratumMin: 2, stratumMax: 3 },
  { name: "La Candelaria", commune: "La Candelaria", city: "Medellín", department: "Antioquia", lat: 6.2486, lng: -75.5742, radius: 0.009, weight: 3, priceMin: 130_000_000, priceMax: 400_000_000, stratumMin: 2, stratumMax: 3 },
  { name: "Copacabana", commune: "Copacabana", city: "Copacabana", department: "Antioquia", lat: 6.3437, lng: -75.5074, radius: 0.018, weight: 3, priceMin: 130_000_000, priceMax: 350_000_000, stratumMin: 2, stratumMax: 3 },
];

// ── Property mixes ───────────────────────────────────────────────────────
type PropertyType = NonNullable<NewDeal["propertyType"]>;

const PROPERTY_TYPES: { value: PropertyType; weight: number }[] = [
  { value: "apartamento", weight: 65 },
  { value: "casa", weight: 14 },
  { value: "apartaestudio", weight: 10 },
  { value: "penthouse", weight: 3 },
  { value: "lote", weight: 2 },
  { value: "oficina", weight: 2 },
  { value: "local", weight: 2 },
  { value: "casa_campestre", weight: 1 },
  { value: "finca", weight: 0.5 },
  { value: "bodega", weight: 0.5 },
];

const SOURCES = ["metrocuadrado", "fincaraiz", "manual"] as const;

const BEDROOMS_DIST = [
  { value: 1, weight: 7 },
  { value: 2, weight: 35 },
  { value: 3, weight: 40 },
  { value: 4, weight: 15 },
  { value: 5, weight: 3 },
];

// ── Row generation ───────────────────────────────────────────────────────
const COUNT = 2_000;
const rows: NewDeal[] = [];
const now = Date.now();

for (let i = 0; i < COUNT; i++) {
  const n = pickWeighted(NEIGHBORHOODS.map((value) => ({ value, weight: value.weight })));

  // Lat/lng with gaussian noise (clamped to ±2σ to avoid wild outliers)
  const lat = n.lat + Math.max(-2, Math.min(2, gaussian())) * n.radius;
  const lng = n.lng + Math.max(-2, Math.min(2, gaussian())) * n.radius;

  const propertyType = pickWeighted(PROPERTY_TYPES);
  const stratum = randInt(n.stratumMin, n.stratumMax);

  // Price: skewed toward neighborhood floor (most listings are on the
  // affordable end of their neighborhood's range).
  const priceCop = Math.round(
    n.priceMin + (n.priceMax - n.priceMin) * Math.pow(rand(), 1.6),
  );

  // Bedrooms / bathrooms by property type
  let bedrooms: number;
  let bathrooms: number;
  if (propertyType === "apartaestudio") {
    bedrooms = 1;
    bathrooms = 1;
  } else if (propertyType === "lote" || propertyType === "bodega" || propertyType === "local" || propertyType === "oficina") {
    bedrooms = 0;
    bathrooms = randInt(1, 2);
  } else {
    bedrooms = pickWeighted(BEDROOMS_DIST);
    bathrooms = Math.max(1, Math.min(bedrooms, randInt(1, bedrooms + 1)));
  }

  // Area correlated with bedrooms + property type
  let baseArea: number;
  if (propertyType === "apartaestudio") baseArea = randInt(28, 45);
  else if (propertyType === "lote") baseArea = randInt(60, 600);
  else if (propertyType === "casa" || propertyType === "casa_campestre") baseArea = 60 + bedrooms * 30 + randInt(0, 60);
  else if (propertyType === "finca") baseArea = randInt(150, 500);
  else if (propertyType === "bodega") baseArea = randInt(80, 400);
  else if (propertyType === "local" || propertyType === "oficina") baseArea = randInt(35, 200);
  else if (propertyType === "penthouse") baseArea = 90 + bedrooms * 25 + randInt(20, 80);
  else baseArea = 38 + bedrooms * 18 + randInt(0, 30); // apartamento
  const areaBuiltM2 = baseArea;
  const areaPrivateM2 = Math.max(15, Math.round(areaBuiltM2 * (0.85 + rand() * 0.1)));

  const pricePerM2Cop = Math.round(priceCop / areaBuiltM2);

  // Floors — only for vertical types
  const isVertical = propertyType === "apartamento" || propertyType === "apartaestudio" || propertyType === "penthouse" || propertyType === "oficina";
  const totalFloors = isVertical ? randInt(4, 25) : null;
  const floor = isVertical && totalFloors ? randInt(1, totalFloors) : null;

  // Year built — newer construction more common in Sabaneta/Envigado
  const newish = n.name === "Sabaneta" || n.name === "El Poblado" || n.name === "Envigado";
  const yearBuilt = newish ? randInt(2008, 2024) : randInt(1985, 2024);

  // Parking — higher stratum more likely to have multiple spots
  const parkingSpaces =
    stratum >= 5 ? randInt(1, 3) : stratum >= 3 ? randInt(0, 2) : randInt(0, 1);

  // Amenities — probability by stratum
  const amenityProb = (base: number) => rand() < base + stratum * 0.08;
  const hasElevator = isVertical && (totalFloors ?? 0) >= 4 ? amenityProb(0.1) : false;
  const hasPool = amenityProb(-0.1);
  const hasGym = amenityProb(-0.05);
  const hasSecurity = amenityProb(0.0);
  const hasBalcony = isVertical ? amenityProb(0.2) : rand() < 0.3;
  const isFurnished = rand() < 0.08;
  const petsAllowed = rand() < 0.55;

  // Deal scoring — most listings are at-market, ~30% have a discount
  const hasDiscount = rand() < 0.3;
  const discountPct = hasDiscount ? 5 + Math.round(rand() * 25 * 100) / 100 : null; // 5-30%
  const marketPriceCop = hasDiscount
    ? Math.round(priceCop / (1 - discountPct! / 100))
    : Math.round(priceCop * (1 + (rand() - 0.5) * 0.06)); // ±3%
  const roiAnnualPct = (5 + rand() * 9).toFixed(2); // 5-14%
  const dealScore = Math.max(30, Math.min(95, Math.round(55 + gaussian() * 12 + (hasDiscount ? 15 : 0))));
  const isVerified = rand() < 0.65;
  const isExclusive = rand() < 0.1;

  // Listed within last 60 days
  const listedAt = new Date(now - Math.floor(rand() * 60 * 24 * 60 * 60 * 1000));

  // Title in DealHunter brand voice — concrete, no marketing
  const title = `${propertyType[0]!.toUpperCase()}${propertyType.slice(1)} en ${n.name} — ${bedrooms > 0 ? `${bedrooms}H · ` : ""}${areaBuiltM2}m²`;
  const description = hasDiscount
    ? `Precio ${discountPct}% por debajo del mercado. ${bedrooms > 0 ? `${bedrooms} habitaciones, ` : ""}${bathrooms} baños, estrato ${stratum}.`
    : `${bedrooms > 0 ? `${bedrooms} habitaciones, ` : ""}${bathrooms} baños, estrato ${stratum}. Año de construcción ${yearBuilt}.`;

  const source = pick(SOURCES);

  rows.push({
    title,
    description,
    propertyType,
    operationType: "venta",
    propertyStatus: yearBuilt >= 2022 ? "nuevo" : "usado",

    priceCop,
    adminFeeCop: isVertical ? Math.round(priceCop * 0.0001) : null,
    pricePerM2Cop,

    areaBuiltM2,
    areaPrivateM2,
    areaTotalM2: propertyType === "lote" || propertyType === "casa" || propertyType === "casa_campestre" || propertyType === "finca" ? areaBuiltM2 + randInt(20, 200) : null,

    bedrooms,
    bathrooms,
    parkingSpaces,
    floor,
    totalFloors,
    yearBuilt,
    stratum,

    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
    address: null,
    neighborhood: n.name,
    commune: n.commune,
    city: n.city,
    department: n.department,
    country: "CO",

    hasElevator,
    hasPool,
    hasGym,
    hasSecurity,
    hasBalcony,
    isFurnished,
    petsAllowed,

    source,
    sourceUrl: `https://${source}.com/inmueble/${i + 1}`,
    sourceId: `seed-${i + 1}`,

    marketPriceCop,
    discountPct: discountPct?.toFixed(2),
    roiAnnualPct,
    dealScore,
    isVerified,
    isExclusive,

    listedAt,
  });
}

// ── Insert ───────────────────────────────────────────────────────────────
console.log(`generated ${rows.length} rows. wiping deals and inserting…`);

await sql`DELETE FROM deals`;

const BATCH = 200;
let inserted = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH);
  await db.insert(deals).values(chunk);
  inserted += chunk.length;
  process.stdout.write(`  inserted ${inserted}/${rows.length}\r`);
}
process.stdout.write("\n");

const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM deals`;
const [{ min, max, avg }] = await sql`
  SELECT MIN(price_cop)::bigint AS min, MAX(price_cop)::bigint AS max, AVG(price_cop)::bigint AS avg FROM deals
`;
console.log(`done. ${count} rows.`);
console.log(`  price COP — min: ${Number(min).toLocaleString()}, max: ${Number(max).toLocaleString()}, avg: ${Number(avg).toLocaleString()}`);
