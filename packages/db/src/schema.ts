import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const deals = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    originalPriceCents: integer("original_price_cents"),
    source: text("source"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("deals_created_at_idx").on(table.createdAt)],
);

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
