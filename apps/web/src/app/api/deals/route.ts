import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, deals } from "@deal-hunter/db";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(deals).orderBy(desc(deals.createdAt)).limit(50);
  return NextResponse.json({ deals: rows });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, url, priceCents, originalPriceCents, source, description, imageUrl } = body ?? {};

  if (typeof title !== "string" || typeof url !== "string" || typeof priceCents !== "number") {
    return NextResponse.json(
      { error: "title (string), url (string), and priceCents (number) are required" },
      { status: 400 },
    );
  }

  const db = getDb();
  const [created] = await db
    .insert(deals)
    .values({ title, url, priceCents, originalPriceCents, source, description, imageUrl })
    .returning();

  return NextResponse.json({ deal: created }, { status: 201 });
}
