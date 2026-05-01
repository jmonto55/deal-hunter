/**
 * Seeds discount_pct / market_price_cop / deal_score for NULL rows, and
 * populates comparable_group_label for ALL rows (including already-scored ones).
 * Safe to re-run — discount fields only written where currently NULL;
 * comparable_group_label is always overwritten since it's new data.
 *
 * Run: npm run db:seed-demo-discounts  (from packages/db)
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// ── PRNG (Mulberry32) — same pattern as seed.ts ───────────────────────────
function strHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

const rand = makeRng(strHash("dealhunter-demo"));

// ── Band definitions ──────────────────────────────────────────────────────
type BandName =
  | "strong_opportunity"
  | "mild_opportunity"
  | "neutral"
  | "mild_over"
  | "strong_over";

const BANDS: Record<BandName, { min: number; max: number }> = {
  strong_opportunity: { min: 15, max: 25 },
  mild_opportunity:   { min: 5,  max: 15 },
  neutral:            { min: -5, max: 5  },
  mild_over:          { min: -15, max: -5 },
  strong_over:        { min: -25, max: -15 },
};

const BIAS_OPTIONS: { value: BandName; weight: number }[] = [
  { value: "strong_opportunity", weight: 10 },
  { value: "mild_opportunity",   weight: 25 },
  { value: "neutral",            weight: 30 },
  { value: "mild_over",          weight: 25 },
  { value: "strong_over",        weight: 10 },
];

function pickWeighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1]!.value;
}

function sampleFromBand(band: BandName): number {
  const { min, max } = BANDS[band];
  const center = (min + max) / 2;
  const jitter = (rand() - 0.5) * 10; // ±5, clamped to band
  return Math.round(Math.max(min, Math.min(max, center + jitter)) * 100) / 100;
}

// ── Comparable group label helpers ────────────────────────────────────────
const PLURALS: Record<string, string> = {
  apartamento:    "apartamentos",
  casa:           "casas",
  apartaestudio:  "apartaestudios",
  penthouse:      "penthouses",
  lote:           "lotes",
  oficina:        "oficinas",
  local:          "locales",
  bodega:         "bodegas",
  finca:          "fincas",
  casa_campestre: "casas campestres",
};

function pluralize(type: string): string {
  return PLURALS[type] ?? `${type}s`;
}

function buildLabel(
  propertyType: string,
  neighborhood: string | null,
  stratum: number | null,
): string {
  const plural = pluralize(propertyType);
  const hood = neighborhood ?? "—";
  if (stratum !== null) return `${plural} de ${hood}, estrato ${stratum}`;
  return `${plural} de ${hood}`;
}

// ── Fetch ALL rows ────────────────────────────────────────────────────────
type AllRow = {
  id: number;
  price_cop: number;
  neighborhood: string | null;
  property_type: string;
  stratum: number | null;
  discount_pct: string | null; // numeric comes back as string from neon
};

const allRows = await sql<AllRow[]>`
  SELECT id, price_cop, neighborhood, property_type, stratum, discount_pct
  FROM deals
  ORDER BY id
`;

console.log(`Total rows: ${allRows.length}`);

const nullRows = allRows.filter((r) => r.discount_pct === null);
console.log(`Rows with NULL discount_pct: ${nullRows.length}`);

// ── Part 1 — Update comparable_group_label for ALL rows ──────────────────
console.log("\nUpdating comparable_group_label for all rows...");

const BATCH = 500;
let labelUpdated = 0;

for (let i = 0; i < allRows.length; i += BATCH) {
  const chunk = allRows.slice(i, i + BATCH);
  const valueParts: string[] = [];
  const params: (number | string)[] = [];
  let p = 1;

  for (const r of chunk) {
    const label = buildLabel(r.property_type, r.neighborhood, r.stratum);
    valueParts.push(`($${p++}, $${p++})`);
    params.push(r.id, label);
  }

  const query = `
    UPDATE deals
    SET comparable_group_label = v.cgl
    FROM (VALUES ${valueParts.join(", ")}) AS v(id, cgl)
    WHERE deals.id = v.id::int
  `;

  await sql(query, params);
  labelUpdated += chunk.length;
  process.stdout.write(`  ${labelUpdated}/${allRows.length}\r`);
}

process.stdout.write("\n");
console.log(`comparable_group_label updated on ${labelUpdated} rows`);

// ── Part 2 — Seed discount fields for NULL rows only ─────────────────────
if (nullRows.length === 0) {
  console.log("\nNo NULL discount rows — nothing more to do.");
  process.exit(0);
}

// Assign neighborhood biases (reproducible)
const neighborhoods = [...new Set(nullRows.map((r) => r.neighborhood ?? "__none__"))].sort();
const neighborhoodBias: Record<string, BandName> = {};
for (const n of neighborhoods) {
  neighborhoodBias[n] = pickWeighted(BIAS_OPTIONS);
}

console.log(`\nAssigned biases to ${neighborhoods.length} neighborhoods:`);
for (const n of neighborhoods) {
  console.log(`  ${n.padEnd(24)} → ${neighborhoodBias[n]}`);
}

type DiscountUpdate = {
  id: number;
  discountPct: number;
  marketPriceCop: number;
  dealScore: number;
};

const discountUpdates: DiscountUpdate[] = nullRows.map((row) => {
  const bias = neighborhoodBias[row.neighborhood ?? "__none__"]!;
  const discountPct = sampleFromBand(bias);
  const marketPriceCop =
    Math.round((row.price_cop / (1 - discountPct / 100)) / 1_000_000) * 1_000_000;
  const dealScore = Math.max(0, Math.min(100, Math.round(50 + discountPct)));
  return { id: row.id, discountPct, marketPriceCop, dealScore };
});

// Batch UPDATE discount fields — WHERE discount_pct IS NULL to be explicit
let discountUpdated = 0;
for (let i = 0; i < discountUpdates.length; i += BATCH) {
  const chunk = discountUpdates.slice(i, i + BATCH);
  const valueParts: string[] = [];
  const params: (number | string)[] = [];
  let p = 1;

  for (const u of chunk) {
    valueParts.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
    params.push(u.id, u.discountPct.toFixed(2), u.marketPriceCop, u.dealScore);
  }

  const query = `
    UPDATE deals
    SET discount_pct     = v.dp::numeric(5,2),
        market_price_cop = v.mpc::bigint,
        deal_score       = v.ds::smallint
    FROM (VALUES ${valueParts.join(", ")}) AS v(id, dp, mpc, ds)
    WHERE deals.id = v.id::int
      AND deals.discount_pct IS NULL
  `;

  await sql(query, params);
  discountUpdated += chunk.length;
  process.stdout.write(`  discount updated ${discountUpdated}/${discountUpdates.length}\r`);
}

process.stdout.write("\n");
console.log(`\nDiscount fields updated on ${discountUpdated} rows`);

// ── Histogram ─────────────────────────────────────────────────────────────
console.log("\n=== Discount histogram (seeded rows only) ===");
const BUCKET_STARTS = [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20];
const bucketCounts: Record<number, number> = {};
for (const b of BUCKET_STARTS) bucketCounts[b] = 0;
for (const u of discountUpdates) {
  let key = BUCKET_STARTS[0]!;
  for (const b of BUCKET_STARTS) { if (u.discountPct >= b) key = b; }
  bucketCounts[key]++;
}
for (const b of BUCKET_STARTS) {
  const count = bucketCounts[b]!;
  const pct = ((count / discountUpdates.length) * 100).toFixed(1);
  const bar = "█".repeat(Math.round(Number(pct) / 2));
  const sign = (v: number) => (v >= 0 ? "+" : "");
  const label = `${sign(b)}${b}% to ${sign(b + 5)}${b + 5}%`;
  console.log(`  ${label.padEnd(14)}: ${String(count).padStart(4)}  (${pct}%)  ${bar}`);
}

// ── Final coverage ─────────────────────────────────────────────────────────
const [coverage] = await sql<
  { total: string; scored: string; labeled: string }[]
>`
  SELECT
    COUNT(*)               AS total,
    COUNT(discount_pct)    AS scored,
    COUNT(comparable_group_label) AS labeled
  FROM deals
`;
console.log("\n=== Final coverage ===");
console.log(
  `  Total: ${coverage!.total}  |  Scored: ${coverage!.scored}  |  Labeled: ${coverage!.labeled}`,
);
