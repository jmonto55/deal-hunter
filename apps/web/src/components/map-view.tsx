"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Map } from "react-map-gl/maplibre";

/**
 * Free Carto basemaps. Vector styles, no API key.
 * https://github.com/CartoDB/basemap-styles
 */
const STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function MapView() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Default to dark style on first paint to match the dark-mode-first brand;
  // we re-render with the resolved theme once the client mounts.
  const styleUrl = !mounted || resolvedTheme === "dark" ? STYLE_DARK : STYLE_LIGHT;

  return (
    <div className="absolute inset-0">
      <Map
        // Force a remount when the style URL changes — MapLibre's `setStyle`
        // is finicky with diffing, and the cleaner UX is a fresh map.
        key={styleUrl}
        mapStyle={styleUrl}
        initialViewState={{
          // Medellín
          longitude: -75.5812,
          latitude: 6.2476,
          zoom: 11,
        }}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
