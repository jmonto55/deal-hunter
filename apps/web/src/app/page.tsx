import { desc } from "drizzle-orm";
import { getDb, deals as dealsTable, type Deal } from "@deal-hunter/db";

export const dynamic = "force-dynamic";

async function getDeals(): Promise<Deal[]> {
  try {
    const db = getDb();
    return await db.select().from(dealsTable).orderBy(desc(dealsTable.createdAt)).limit(20);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const deals = await getDeals();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Deal Hunter</h1>
        <p className="mt-2 text-neutral-500">Latest deals from around the web.</p>
      </header>

      {deals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          No deals yet. Push the schema with{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm dark:bg-neutral-800">npm run db:push</code>{" "}
          then add one via{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm dark:bg-neutral-800">POST /api/deals</code>.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {deals.map((deal) => (
            <li
              key={deal.id}
              className="rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-800"
            >
              <a href={deal.url} target="_blank" rel="noreferrer" className="block">
                <h2 className="font-semibold">{deal.title}</h2>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">${(deal.priceCents / 100).toFixed(2)}</span>
                  {deal.originalPriceCents != null && (
                    <span className="text-sm text-neutral-500 line-through">
                      ${(deal.originalPriceCents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                {deal.source && <p className="mt-1 text-xs text-neutral-500">{deal.source}</p>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
