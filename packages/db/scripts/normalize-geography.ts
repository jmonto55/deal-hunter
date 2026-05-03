/**
 * Normalizes geographic columns in the `deals` table.
 *
 * What this fixes:
 *   - Non-Medellín rows have `commune` = city name (e.g. "Envigado").
 *     Those municipalities have no commune subdivision, so `commune` → NULL.
 *   - Medellín rows already have the correct commune; no change needed.
 *   - `neighborhood` and `city` are left untouched.
 *
 * Idempotent: safe to run multiple times. Logs any `neighborhood` values
 * not found in NEIGHBORHOOD_TO_HIERARCHY so gaps can be caught early.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNotNull, ne } from "drizzle-orm";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { deals } from "../src/schema.js";
import { NEIGHBORHOOD_TO_HIERARCHY } from "../src/geographic-hierarchy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  // ── 1. Fetch all rows with their current geographic values ──────────────
  const rows = await db
    .select({
      id: deals.id,
      neighborhood: deals.neighborhood,
      city: deals.city,
      commune: deals.commune,
    })
    .from(deals);

  console.log(`\nTotal rows: ${rows.length}`);

  // ── 2. Plan updates ──────────────────────────────────────────────────────
  const unmapped: string[] = [];
  const updates: Array<{ id: number; commune: string | null }> = [];

  for (const row of rows) {
    const nbhd = row.neighborhood ?? "";
    const hierarchy = NEIGHBORHOOD_TO_HIERARCHY[nbhd];

    if (!hierarchy) {
      if (nbhd && !unmapped.includes(nbhd)) unmapped.push(nbhd);
      continue;
    }

    const desiredCommune = hierarchy.commune; // null for non-Medellín
    if (row.commune !== desiredCommune) {
      updates.push({ id: row.id, commune: desiredCommune });
    }
  }

  // ── 3. Report unmapped values ─────────────────────────────────────────────
  if (unmapped.length > 0) {
    console.warn("\nUnmapped neighborhood values (no update applied):");
    unmapped.forEach((v) => console.warn(`  • "${v}"`));
  } else {
    console.log("All neighborhood values mapped ✓");
  }

  // ── 4. Apply updates in batches ───────────────────────────────────────────
  if (updates.length === 0) {
    console.log("No commune corrections needed — already normalized.\n");
    return;
  }

  console.log(`\nUpdating ${updates.length} rows…`);
  let done = 0;
  for (const { id, commune } of updates) {
    await db.update(deals).set({ commune }).where(eq(deals.id, id));
    done++;
    if (done % 100 === 0) process.stdout.write(`  ${done}/${updates.length}\r`);
  }
  console.log(`  ${done}/${updates.length} — done ✓`);

  // ── 5. Final distribution ─────────────────────────────────────────────────
  console.log("\nFinal distribution:");
  const dist = await sql`
    SELECT city, commune, neighborhood, COUNT(*)::int AS count
    FROM deals
    GROUP BY city, commune, neighborhood
    ORDER BY count DESC
  `;
  for (const r of dist) {
    const communeStr = r.commune ?? "(null)";
    console.log(`  ${r.city} | ${communeStr} | ${r.neighborhood ?? "(null)"} — ${r.count}`);
  }
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
