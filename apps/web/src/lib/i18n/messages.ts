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
  "filter.municipality": "Municipio",
  "filter.commune": "Comuna",
  "filter.stratum": "Estrato",
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
    "{type} de {area} m² con {bedrooms} habitaciones y {bathrooms} baños en {location}. Disfruta de acabados de primer nivel, ventilación natural e iluminación privilegiada en una de las zonas más buscadas del Área Metropolitana.",
  "amenity.pool": "Piscina",
  "amenity.gym": "Gimnasio",
  "amenity.security": "Vigilancia 24/7",
  "amenity.rooftop": "Terraza",
  "amenity.garden": "Jardines",
  "amenity.concierge": "Portería",
  "amenity.playground": "Zona infantil",
  "amenity.bbq": "BBQ",

  // Map tooltip + controls
  "map.propertySingular": "propiedad",
  "map.propertyPlural": "propiedades",
  "map.avg": "promedio",
  "map.fitToFilters": "Ajustar al filtro",
  "map.zoomIn": "Acercar",
  "map.zoomOut": "Alejar",

  // Business analysis page
  "drawer.analysisAria": "Análisis de negocio",
  "analysis.title": "Análisis de Inversión",
  "analysis.back": "Volver",
  "analysis.propertyContext": "Propiedad en {neighborhood}",
  "analysis.modelLabel": "Modelo de negocio",
  "analysis.model.flipping": "Flipping",
  "analysis.model.flipping.desc":
    "Compra por debajo del precio de mercado, reforma y venta por encima del precio promedio. Requiere capital para remodelación y tiempo de ejecución.",
  "analysis.model.buySell": "Compra y Venta",
  "analysis.model.buySell.desc":
    "Identifica propiedades con muy bajo precio por m² para reventa inmediata. Menor ganancia, pero 0 gastos ni tiempos de reforma.",
  "analysis.model.coliving": "Coliving",
  "analysis.model.coliving.desc":
    "Compra para dividir en unidades independientes y arrendar por habitación. Usa el precio promedio de arriendo por m² dividido entre las unidades disponibles.",
  "analysis.model.buyRent": "Compra y Arriendo",
  "analysis.model.buyRent.desc":
    "Arriendo tradicional de largo plazo. Rendimiento estable basado en el precio de mercado de arriendo de la zona.",
  "analysis.chartTitle": "Evolución de la inversión",
  "analysis.chartEmpty": "La proyección aparecerá aquí una vez se implemente el modelo.",
  "analysis.compareToggle": "Comparar con CDT / alto rendimiento",
  "analysis.benchmarkLabel": "CDT / Cajita ~10.5% EA",
  "analysis.advantage": "Ventaja vs. CDT",
  "analysis.disadvantage": "Diferencia vs. CDT",
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
  "filter.municipality": "Municipality",
  "filter.commune": "Commune",
  "filter.stratum": "Stratum",
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
    "{type} of {area} m² with {bedrooms} bedrooms and {bathrooms} bathrooms in {location}. Enjoy top-tier finishes, natural ventilation, and prime light in one of the most sought-after areas of the Metropolitan Region.",
  "amenity.pool": "Pool",
  "amenity.gym": "Gym",
  "amenity.security": "24/7 security",
  "amenity.rooftop": "Rooftop",
  "amenity.garden": "Gardens",
  "amenity.concierge": "Concierge",
  "amenity.playground": "Playground",
  "amenity.bbq": "BBQ",

  "map.propertySingular": "property",
  "map.propertyPlural": "properties",
  "map.avg": "avg",
  "map.fitToFilters": "Fit to filter",
  "map.zoomIn": "Zoom in",
  "map.zoomOut": "Zoom out",

  // Business analysis page
  "drawer.analysisAria": "Business analysis",
  "analysis.title": "Investment Analysis",
  "analysis.back": "Back",
  "analysis.propertyContext": "Property in {neighborhood}",
  "analysis.modelLabel": "Business model",
  "analysis.model.flipping": "Flipping",
  "analysis.model.flipping.desc":
    "Buy properties below market price, refurbish, and sell slightly above average. Requires capital for renovation and execution time.",
  "analysis.model.buySell": "Buy & Sell",
  "analysis.model.buySell.desc":
    "Identify very low m² price properties and resell immediately — less profit but zero refurbishing overhead or delays.",
  "analysis.model.coliving": "Coliving",
  "analysis.model.coliving.desc":
    "Buy and split into independent units, rent by room. Uses average m² rental price divided by the number of available units.",
  "analysis.model.buyRent": "Buy & Rent",
  "analysis.model.buyRent.desc":
    "Traditional long-term rental. Stable yield based on the area's market rental price.",
  "analysis.chartTitle": "Investment evolution",
  "analysis.chartEmpty": "The projection will appear here once the model is implemented.",
  "analysis.compareToggle": "Compare with CDT / high-yield account",
  "analysis.benchmarkLabel": "CDT / Cajita ~10.5% EA",
  "analysis.advantage": "Advantage vs. CDT",
  "analysis.disadvantage": "Gap vs. CDT",
};

export type MessageKey = keyof typeof es;

export const messages: Record<Locale, Record<MessageKey, string>> = { es, en };

/** Format a number for the active locale (1.234,56 in es-CO; 1,234.56 in en-US). */
export function formatNumber(value: number, locale: Locale): string {
  return value.toLocaleString(locale === "es" ? "es-CO" : "en-US");
}
