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

  // Map tooltip + controls
  "map.propertySingular": "propiedad",
  "map.propertyPlural": "propiedades",
  "map.avg": "promedio",
  "map.fitToFilters": "Ajustar al filtro",
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

  "map.propertySingular": "property",
  "map.propertyPlural": "properties",
  "map.avg": "avg",
  "map.fitToFilters": "Fit to filter",
};

export type MessageKey = keyof typeof es;

export const messages: Record<Locale, Record<MessageKey, string>> = { es, en };

/** Format a number for the active locale (1.234,56 in es-CO; 1,234.56 in en-US). */
export function formatNumber(value: number, locale: Locale): string {
  return value.toLocaleString(locale === "es" ? "es-CO" : "en-US");
}
