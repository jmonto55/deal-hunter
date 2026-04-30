/**
 * Fills discount_pct, market_price_cop, and deal_score for rows where
 * discount_pct IS NULL, using a reproducible geographically-clustered
 * distribution. Safe to re-run — only touches NULL rows.
 *
 * Desired distribution across filled rows:
 *   10% strong opportunity  (+15 to +25)
 *   25% mild opportunity    ( +5 to +15)
 *   30% neutral             ( -5 to  +5)
 *   25% mild over-market    (-15 to  -5)
 *   10% strong over-market  (-25 to -15)
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

// ── Fetch rows needing discount ───────────────────────────────────────────
type NullRow = { id: number; price_cop: number; neighborhood: string | null };

const nullRows = await sql<NullRow[]>`
  SELECT id, price_cop, neighborhood
  FROM deals
  WHERE discount_pct IS NULL
  ORDER BY id
`;

console.log(`Found ${nullRows.length} rows with NULL discount_pct`);

if (nullRows.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

// ── Assign neighborhood biases (reproducible) ─────────────────────────────
const neighborhoods = [...new Set(nullRows.map((r) => r.neighborhood ?? "__none__"))].sort();

const neighborhoodBias: Record<string, BandName> = {};
for (const n of neighborhoods) {
  neighborhoodBias[n] = pickWeighted(BIAS_OPTIONS);
}

console.log(`Assigned biases to ${neighborhoods.length} neighborhoods:`);
for (const n of neighborhoods) {
  console.log(`  ${n.padEnd(24)} → ${neighborhoodBias[n]}`);
}

// ── Compute updates in memory ─────────────────────────────────────────────
type UpdateRow = {
  id: number;
  discountPct: number;
  marketPriceCop: number;
  dealScore: number;
};

const updates: UpdateRow[] = nullRows.map((row) => {
  const bias = neighborhoodBias[row.neighborhood ?? "__none__"]!;
  const discountPct = sampleFromBand(bias);
  const marketPriceCop =
    Math.round((row.price_cop / (1 - discountPct / 100)) / 1_000_000) * 1_000_000;
  const dealScore = Math.max(0, Math.min(100, Math.round(50 + discountPct)));
  return { id: row.id, discountPct, marketPriceCop, dealScore };
});

// ── Batch UPDATE via VALUES list (fast — one query per 500 rows) ──────────
const BATCH = 500;
let updated = 0;

for (let i = 0; i < updates.length; i += BATCH) {
  const chunk = updates.slice(i, i + BATCH);

  const valueParts: string[] = [];
  const params: (number | string)[] = [];
  let p = 1;

  for (const u of chunk) {
    valueParts.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
    params.push(u.id, u.discountPct.toFixed(2), u.marketPriceCop, u.dealScore);
  }

  const query = `
    UPDATE deals
    SET discount_pct    = v.dp::numeric(5,2),
        market_price_cop = v.mpc::bigint,
        deal_score       = v.ds::smallint
    FROM (VALUES ${valueParts.join(", ")}) AS v(id, dp, mpc, ds)
    WHERE deals.id = v.id::int
  `;

  await sql(query, params);
  updated += chunk.length;
  process.stdout.write(`  updated ${updated}/${updates.length}\r`);
}

process.stdout.write("\n");
console.log(`\nTotal rows updated: ${updated}`);

// ── Histogram (5% buckets) ────────────────────────────────────────────────
console.log("\n=== Discount histogram (updated rows only) ===");

const BUCKET_STARTS = [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20];
const bucketCounts: Record<number, number> = {};
for (const b of BUCKET_STARTS) bucketCounts[b] = 0;

for (const u of updates) {
  let key = BUCKET_STARTS[0]!;
  for (const b of BUCKET_STARTS) {
    if (u.discountPct >= b) key = b;
  }
  bucketCounts[key]++;
}

for (const b of BUCKET_STARTS) {
  const count = bucketCounts[b]!;
  const pct = ((count / updates.length) * 100).toFixed(1);
  const bar = "█".repeat(Math.round(Number(pct) / 2));
  const sign = (v: number) => (v >= 0 ? "+" : "");
  const label = `${sign(b)}${b}% to ${sign(b + 5)}${b + 5}%`;
  console.log(`  ${label.padEnd(14)}: ${String(count).padStart(4)}  (${pct}%)  ${bar}`);
}

// ── Per-neighborhood summary ──────────────────────────────────────────────
const neighStats: Record<string, { sum: number; count: number }> = {};

for (let i = 0; i < updates.length; i++) {
  const n = nullRows[i]!.neighborhood ?? "__none__";
  if (!neighStats[n]) neighStats[n] = { sum: 0, count: 0 };
  neighStats[n].sum += updates[i]!.discountPct;
  neighStats[n].count++;
}

const sorted = Object.entries(neighStats)
  .map(([name, s]) => ({ name, avg: s.sum / s.count, count: s.count }))
  .sort((a, b) => a.avg - b.avg);

console.log("\n=== Top 5 over-market neighborhoods ===");
for (const n of sorted.slice(0, 5)) {
  console.log(
    `  ${n.name.padEnd(24)}: avg ${n.avg.toFixed(2).padStart(7)}%  (${n.count} listings)`,
  );
}

console.log("\n=== Top 5 opportunity neighborhoods ===");
for (const n of [...sorted].reverse().slice(0, 5)) {
  console.log(
    `  ${n.name.padEnd(24)}: avg ${n.avg.toFixed(2).padStart(7)}%  (${n.count} listings)`,
  );
}

// ── Final coverage ────────────────────────────────────────────────────────
const [coverage] = await sql<
  { total: string; scored: string; pct_scored: string }[]
>`
  SELECT
    COUNT(*)                                                    AS total,
    COUNT(discount_pct)                                         AS scored,
    ROUND(100.0 * COUNT(discount_pct) / NULLIF(COUNT(*), 0), 1) AS pct_scored
  FROM deals
`;

console.log("\n=== Final coverage ===");
console.log(
  `  Total: ${coverage!.total}  |  Scored: ${coverage!.scored}  |  pct_scored: ${coverage!.pct_scored}%`,
);
