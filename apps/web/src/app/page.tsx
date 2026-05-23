import { getDb, deals } from "@deal-hunter/db";
import { DealsExplorer, type DealPoint } from "@/components/deals-explorer";

export const dynamic = "force-dynamic";

async function getDealPoints(): Promise<DealPoint[]> {
  const db = getDb();
  const rows = await db
    .select({
      lat: deals.latitude,
      lng: deals.longitude,
      price: deals.priceCop,
      area: deals.areaBuiltM2,
      bedrooms: deals.bedrooms,
      bathrooms: deals.bathrooms,
      propertyType: deals.propertyType,
      city: deals.city,
      commune: deals.commune,
      neighborhood: deals.neighborhood,
      stratum: deals.stratum,
    })
    .from(deals);
  return rows.map((r) => ({
    lat: Number(r.lat),
    lng: Number(r.lng),
    price: r.price,
    area: r.area,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    propertyType: r.propertyType,
    city: r.city,
    commune: r.commune ?? null,
    neighborhood: r.neighborhood ?? "—",
    stratum: r.stratum ?? null,
  }));
}

export default async function HomePage() {
  const points = await getDealPoints().catch((err) => {
    console.error("[home] getDealPoints failed:", err);
    return [] as DealPoint[];
  });
  return <DealsExplorer points={points} />;
}
