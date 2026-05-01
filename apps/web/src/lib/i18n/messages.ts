/**
 * All user-facing strings for the app. Keys are flat namespaced strings
 * (e.g. "panel.heading"). Both locales must define every key — TS enforces
 * this via the `Messages` type below.
 *
 * Templates support {var} interpolation; pass values via the second arg of
 * `t(key, vars)`. Numbers should be pre-formatted by the caller using the
 * locale-aware `formatNumber` helper below before interpolation.
 */

export type Locale = "es" | "en";

const es = {
  // App / navbar
  "nav.home": "Inicio DealHunter",
  "nav.toggleThemeDark": "Cambiar a modo oscuro",
  "nav.toggleThemeLight": "Cambiar a modo claro",
  "nav.toggleLocale": "Cambiar idioma",

  // Filter panel header
  "panel.heading": "Propiedades Área Metropolitana Medellín",
  "panel.matchSeparator": "de",
  "panel.matchSuffix": "propiedades cumplen los filtros",
  "panel.tabsAria": "Categorías de filtros",

  // Filter section labels
  "filter.price": "Precio",
  "filter.priceLabel": "Rango de precio (COP)",
  "filter.area": "Área",
  "filter.areaLabel": "Área (m²)",
  "filter.areaAria": "Área en metros cuadrados",
  "filter.priceAria": "Rango de precio",
  "filter.propertyType": "Tipo de propiedad",
  "filter.bedrooms": "Habitaciones",
  "filter.bathrooms": "Baños",
  "filter.rooms": "Espacios",
  "filter.neighborhood": "Barrio",
  "filter.reset": "Limpiar",
  "filter.resetLong": "Limpiar filtros",
  "filter.resetAria": "Limpiar todos los filtros",

  // Property type chip labels
  "propertyType.apartamento": "Apartamento",
  "propertyType.casa": "Casa",
  "propertyType.apartaestudio": "Apartaestudio",
  "propertyType.penthouse": "Penthouse",
  "propertyType.lote": "Lote",
  "propertyType.oficina": "Oficina",
  "propertyType.local": "Local",
  "propertyType.bodega": "Bodega",
  "propertyType.finca": "Finca",
  "propertyType.casaCampestre": "Casa campestre",

  // Heatmap legend
  "legend.title": "Precio por área",

  // Property drawer
  "drawer.title": "Detalle de propiedad",
  "drawer.closeAria": "Cerrar",
  "drawer.pricePerM2": "Precio por m²",
  "drawer.parking": "Parqueaderos",
  "drawer.estrato": "Estrato",
  "drawer.yearBuilt": "Año",
  "drawer.hoaFee": "Administración",
  "drawer.daysListed": "Publicado hace {n} días",
  "drawer.amenities": "Amenidades",
  "drawer.description": "Descripción",
  "drawer.descriptionTemplate":
    "{type} de {area} m² con {bedrooms} habitaciones y {bathrooms} baños en {neighborhood}. Disfruta de acabados de primer nivel, ventilación natural e iluminación privilegiada en una de las zonas más buscadas del Área Metropolitana.",
  "amenity.pool": "Piscina",
  "amenity.gym": "Gimnasio",
  "amenity.security": "Vigilancia 24/7",
  "amenity.rooftop": "Terraza",
  "amenity.garden": "Jardines",
  "amenity.concierge": "Portería",
  "amenity.playground": "Zona infantil",
  "amenity.bbq": "BBQ",

  // Discount filter + layer toggles
  "filter.discount": "Descuento vs. mercado",
  "filter.discountAny": "Cualquier",
  "filter.discountInfoText": "Cada propiedad se compara con propiedades similares en su mismo barrio, tipo y estrato. Un descuento positivo significa que está por debajo del precio típico de ese grupo — una posible oportunidad. Un descuento negativo indica sobreprecio frente a comparables.",
  "filter.layers": "Capas del mapa",
  "filter.layerPrice": "Precio",
  "filter.layerDiscount": "Descuento",

  // Map tooltip + controls
  "map.propertySingular": "propiedad",
  "map.propertyPlural": "propiedades",
  "map.avg": "promedio",
  "map.discount": "descuento vs. mercado",
  "map.noDiscount": "sin dato",
  "map.discountBelowPct": "bajo mercado",
  "map.discountAbovePct": "sobre mercado",
  "map.discountAtMarket": "En precio de mercado",
  "map.comparableVs": "vs.",
  "map.fitToFilters": "Ajustar al filtro",
  "map.zoomIn": "Acercar",
  "map.zoomOut": "Alejar",

  // Discount legend
  "legend.discountTitle": "Descuento vs. Mercado",
  "legend.discountMapTitle": "Mapa de oportunidades",
  "legend.discountSubtitle": "Comparado vs. propiedades similares (barrio · tipo · estrato)",
  "legend.overMarket": "Sobre mercado",
  "legend.belowMarket": "Bajo mercado",
  "legend.infoText": "Cada propiedad se compara contra propiedades similares en su mismo barrio, tipo y estrato. El descuento muestra qué tan por debajo (o por encima) está del precio típico de su grupo comparable.",
} as const;

const en: Record<keyof typeof es, string> = {
  "nav.home": "DealHunter home",
  "nav.toggleThemeDark": "Switch to dark mode",
  "nav.toggleThemeLight": "Switch to light mode",
  "nav.toggleLocale": "Switch language",

  "panel.heading": "Medellin Metropolitan Area Properties",
  "panel.matchSeparator": "of",
  "panel.matchSuffix": "properties match filters",
  "panel.tabsAria": "Filter categories",

  "filter.price": "Price",
  "filter.priceLabel": "Price range (COP)",
  "filter.area": "Area",
  "filter.areaLabel": "Area (m²)",
  "filter.areaAria": "Area in square meters",
  "filter.priceAria": "Price range",
  "filter.propertyType": "Property type",
  "filter.bedrooms": "Bedrooms",
  "filter.bathrooms": "Bathrooms",
  "filter.rooms": "Rooms",
  "filter.neighborhood": "Neighborhood",
  "filter.reset": "Clear",
  "filter.resetLong": "Clear filters",
  "filter.resetAria": "Clear all filters",

  "propertyType.apartamento": "Apartment",
  "propertyType.casa": "House",
  "propertyType.apartaestudio": "Studio",
  "propertyType.penthouse": "Penthouse",
  "propertyType.lote": "Lot",
  "propertyType.oficina": "Office",
  "propertyType.local": "Commercial",
  "propertyType.bodega": "Warehouse",
  "propertyType.finca": "Farm",
  "propertyType.casaCampestre": "Country house",

  "legend.title": "Price per area",

  "drawer.title": "Property details",
  "drawer.closeAria": "Close",
  "drawer.pricePerM2": "Price per m²",
  "drawer.parking": "Parking",
  "drawer.estrato": "Stratum",
  "drawer.yearBuilt": "Year built",
  "drawer.hoaFee": "HOA fee",
  "drawer.daysListed": "Listed {n} days ago",
  "drawer.amenities": "Amenities",
  "drawer.description": "Description",
  "drawer.descriptionTemplate":
    "{type} of {area} m² with {bedrooms} bedrooms and {bathrooms} bathrooms in {neighborhood}. Enjoy top-tier finishes, natural ventilation, and prime light in one of the most sought-after areas of the Metropolitan Region.",
  "amenity.pool": "Pool",
  "amenity.gym": "Gym",
  "amenity.security": "24/7 security",
  "amenity.rooftop": "Rooftop",
  "amenity.garden": "Gardens",
  "amenity.concierge": "Concierge",
  "amenity.playground": "Playground",
  "amenity.bbq": "BBQ",

  "filter.discount": "Discount vs. market",
  "filter.discountAny": "Any",
  "filter.discountInfoText": "Each property is compared against similar properties in the same neighborhood, type, and stratum. A positive discount means it's priced below the typical for that group — a potential opportunity. A negative discount indicates it's priced above its comparables.",
  "filter.layers": "Map layers",
  "filter.layerPrice": "Price",
  "filter.layerDiscount": "Discount",

  "map.propertySingular": "property",
  "map.propertyPlural": "properties",
  "map.avg": "avg",
  "map.discount": "discount vs. market",
  "map.noDiscount": "no data",
  "map.discountBelowPct": "below market",
  "map.discountAbovePct": "above market",
  "map.discountAtMarket": "At market price",
  "map.comparableVs": "vs.",
  "map.fitToFilters": "Fit to filter",
  "map.zoomIn": "Zoom in",
  "map.zoomOut": "Zoom out",

  "legend.discountTitle": "Discount vs. Market",
  "legend.discountMapTitle": "Opportunity map",
  "legend.discountSubtitle": "Compared vs. similar properties (neighborhood · type · stratum)",
  "legend.overMarket": "Over market",
  "legend.belowMarket": "Below market",
  "legend.infoText": "Each property is compared against similar properties in the same neighborhood, type, and stratum. The discount shows how far below (or above) the typical price of its comparable group.",
};

export type MessageKey = keyof typeof es;

export const messages: Record<Locale, Record<MessageKey, string>> = { es, en };

/** Format a number for the active locale (1.234,56 in es-CO; 1,234.56 in en-US). */
export function formatNumber(value: number, locale: Locale): string {
  return value.toLocaleString(locale === "es" ? "es-CO" : "en-US");
}
