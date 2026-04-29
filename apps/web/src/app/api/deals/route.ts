import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, deals, type NewDeal } from "@deal-hunter/db";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(deals).orderBy(desc(deals.createdAt)).limit(50);
  return NextResponse.json({ deals: rows });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<NewDeal>;
  const {
    title,
    propertyType,
    operationType,
    priceCop,
    areaBuiltM2,
    latitude,
    longitude,
    city,
  } = body;

  if (
    typeof title !== "string" ||
    !propertyType ||
    !operationType ||
    typeof priceCop !== "number" ||
    typeof areaBuiltM2 !== "number" ||
    typeof latitude !== "string" ||
    typeof longitude !== "string" ||
    typeof city !== "string"
  ) {
    return NextResponse.json(
      {
        error:
          "title, propertyType, operationType, priceCop, areaBuiltM2, latitude, longitude, city are required",
      },
      { status: 400 },
    );
  }

  const db = getDb();
  const [created] = await db.insert(deals).values(body as NewDeal).returning();

  return NextResponse.json({ deal: created }, { status: 201 });
}
