/**
 * Aburrá Valley geographic hierarchy.
 *
 * Level 1 — Municipality (stored in `city` column, NOT NULL):
 *   The 10 municipalities of the Área Metropolitana del Valle de Aburrá.
 *
 * Level 2 — Commune (stored in `commune` column, NULL for non-Medellín):
 *   Only Medellín is subdivided into comunas. All other municipalities are
 *   treated as a single unit — their `commune` column is left NULL.
 *
 * Level 3 — Neighborhood (stored in `neighborhood` column):
 *   Finest grain available. For Medellín seed data this is currently set to
 *   the commune name (barrio-level data not yet ingested). For non-Medellín
 *   it stays as the municipality name until real barrio data is available.
 */

export const ABURRA_MUNICIPALITIES = [
  "Barbosa",
  "Bello",
  "Caldas",
  "Copacabana",
  "Envigado",
  "Girardota",
  "Itagüí",
  "La Estrella",
  "Medellín",
  "Sabaneta",
] as const;

export type AbarraMunicipality = (typeof ABURRA_MUNICIPALITIES)[number];

/** Medellín's 16 comunas + 5 corregimientos. */
export const MEDELLIN_COMMUNES = [
  "Popular",
  "Santa Cruz",
  "Manrique",
  "Aranjuez",
  "Castilla",
  "Doce de Octubre",
  "Robledo",
  "Villa Hermosa",
  "Buenos Aires",
  "La Candelaria",
  "Laureles-Estadio",
  "La América",
  "San Javier",
  "El Poblado",
  "Guayabal",
  "Belén",
  "Altavista",
  "Palmitas",
  "San Antonio de Prado",
  "San Cristóbal",
  "Santa Elena",
] as const;

export type MedellinCommune = (typeof MEDELLIN_COMMUNES)[number];

export type GeoHierarchy = {
  municipality: AbarraMunicipality;
  commune: MedellinCommune | null;
};

/**
 * Maps every known `neighborhood` value to its canonical municipality and
 * optional commune. Non-Medellín entries have `commune: null` because those
 * municipalities don't use the comuna administrative subdivision.
 */
export const NEIGHBORHOOD_TO_HIERARCHY: Record<string, GeoHierarchy> = {
  // ── Medellín communes ────────────────────────────────────────────────────
  "El Poblado":           { municipality: "Medellín", commune: "El Poblado" },
  "Laureles":             { municipality: "Medellín", commune: "Laureles-Estadio" },
  "Belén":                { municipality: "Medellín", commune: "Belén" },
  "Robledo":              { municipality: "Medellín", commune: "Robledo" },
  "Castilla":             { municipality: "Medellín", commune: "Castilla" },
  "La Candelaria":        { municipality: "Medellín", commune: "La Candelaria" },
  "Aranjuez":             { municipality: "Medellín", commune: "Aranjuez" },
  "Manrique":             { municipality: "Medellín", commune: "Manrique" },
  "Popular":              { municipality: "Medellín", commune: "Popular" },
  "Santa Cruz":           { municipality: "Medellín", commune: "Santa Cruz" },
  "Buenos Aires":         { municipality: "Medellín", commune: "Buenos Aires" },
  "Villa Hermosa":        { municipality: "Medellín", commune: "Villa Hermosa" },
  "La América":           { municipality: "Medellín", commune: "La América" },
  "San Javier":           { municipality: "Medellín", commune: "San Javier" },
  "Guayabal":             { municipality: "Medellín", commune: "Guayabal" },
  "Doce de Octubre":      { municipality: "Medellín", commune: "Doce de Octubre" },
  "Altavista":            { municipality: "Medellín", commune: "Altavista" },
  "Palmitas":             { municipality: "Medellín", commune: "Palmitas" },
  "San Antonio de Prado": { municipality: "Medellín", commune: "San Antonio de Prado" },
  "San Cristóbal":        { municipality: "Medellín", commune: "San Cristóbal" },
  "Santa Elena":          { municipality: "Medellín", commune: "Santa Elena" },
  // ── Other Aburrá Valley municipalities (no commune subdivision) ──────────
  "Bello":                { municipality: "Bello",       commune: null },
  "Copacabana":           { municipality: "Copacabana",  commune: null },
  "Envigado":             { municipality: "Envigado",    commune: null },
  "Itagüí":               { municipality: "Itagüí",      commune: null },
  "La Estrella":          { municipality: "La Estrella", commune: null },
  "Sabaneta":             { municipality: "Sabaneta",    commune: null },
  "Caldas":               { municipality: "Caldas",      commune: null },
  "Barbosa":              { municipality: "Barbosa",     commune: null },
  "Girardota":            { municipality: "Girardota",   commune: null },
};
