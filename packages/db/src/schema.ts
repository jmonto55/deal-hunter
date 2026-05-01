import {
  pgTable,
  pgEnum,
  serial,
  bigint,
  integer,
  smallint,
  text,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Property classification enums — values mirror what Metrocuadrado and
 * Fincaraiz expose on their listings so we can ingest from those sources
 * without translation tables.
 */
export const propertyTypeEnum = pgEnum("property_type", [
  "apartamento",
  "casa",
  "apartaestudio",
  "penthouse",
  "lote",
  "oficina",
  "local",
  "bodega",
  "finca",
  "casa_campestre",
]);

export const operationTypeEnum = pgEnum("operation_type", [
  "venta",
  "arriendo",
  "arriendo_venta",
]);

export const propertyStatusEnum = pgEnum("property_status", [
  "nuevo",
  "usado",
  "en_proyecto",
]);

/**
 * `deals` is a property listing with DealHunter scoring layered on top.
 * Pricing lives in COP (bigint — Colombian real-estate prices routinely
 * exceed int4's 2.1B max). bigint columns use `mode: "number"` because
 * even 5T COP fits well below JS's MAX_SAFE_INTEGER (~9 quadrillion).
 */
export const deals = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),

    title: text("title").notNull(),
    description: text("description"),
    propertyType: propertyTypeEnum("property_type").notNull(),
    operationType: operationTypeEnum("operation_type").notNull(),
    propertyStatus: propertyStatusEnum("property_status"),

    // Pricing — COP
    priceCop: bigint("price_cop", { mode: "number" }).notNull(),
    adminFeeCop: bigint("admin_fee_cop", { mode: "number" }),
    pricePerM2Cop: bigint("price_per_m2_cop", { mode: "number" }),

    // Areas (m²)
    areaBuiltM2: integer("area_built_m2").notNull(),
    areaPrivateM2: integer("area_private_m2"),
    areaTotalM2: integer("area_total_m2"),

    // Physical features
    bedrooms: smallint("bedrooms").notNull().default(0),
    bathrooms: smallint("bathrooms").notNull().default(0),
    parkingSpaces: smallint("parking_spaces"),
    floor: smallint("floor"),
    totalFloors: smallint("total_floors"),
    yearBuilt: smallint("year_built"),
    stratum: smallint("stratum"), // Colombian socioeconomic 1–6

    // Location
    latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
    longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
    address: text("address"),
    neighborhood: text("neighborhood"),
    commune: text("commune"),
    city: text("city").notNull(),
    department: text("department"),
    country: text("country").notNull().default("CO"),

    // Amenities
    hasElevator: boolean("has_elevator").notNull().default(false),
    hasPool: boolean("has_pool").notNull().default(false),
    hasGym: boolean("has_gym").notNull().default(false),
    hasSecurity: boolean("has_security").notNull().default(false),
    hasBalcony: boolean("has_balcony").notNull().default(false),
    isFurnished: boolean("is_furnished").notNull().default(false),
    petsAllowed: boolean("pets_allowed").notNull().default(false),

    // Source attribution (origin platform + their internal ID for dedup)
    source: text("source"),
    sourceUrl: text("source_url"),
    sourceId: text("source_id"),
    images: text("images").array(),

    // DealHunter scoring — the analyst layer on top of the raw listing
    marketPriceCop: bigint("market_price_cop", { mode: "number" }),
    discountPct: numeric("discount_pct", { precision: 5, scale: 2 }),
    roiAnnualPct: numeric("roi_annual_pct", { precision: 5, scale: 2 }),
    dealScore: smallint("deal_score"),
    comparableGroupLabel: text("comparable_group_label"),
    isVerified: boolean("is_verified").notNull().default(false),
    isExclusive: boolean("is_exclusive").notNull().default(false),

    listedAt: timestamp("listed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("deals_city_idx").on(table.city),
    index("deals_property_type_idx").on(table.propertyType),
    index("deals_operation_type_idx").on(table.operationType),
    index("deals_price_cop_idx").on(table.priceCop),
    index("deals_created_at_idx").on(table.createdAt),
    index("deals_lat_lng_idx").on(table.latitude, table.longitude),
    // Composite unique constraint dedupes ingested listings by their origin platform.
    // Manual entries (source NULL) won't collide — Postgres treats NULLs as distinct by default.
    uniqueIndex("deals_source_unique_idx").on(table.source, table.sourceId),
  ],
);

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
