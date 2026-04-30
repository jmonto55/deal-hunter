"use client";

import { PRICE_STOPS } from "@/components/map-view";
import { useT } from "@/lib/i18n/provider";

function formatCOPShort(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  return `$${value.toLocaleString("es-CO")}`;
}

function stopsToCssGradient(stops: Array<[number, [number, number, number, number]]>) {
  return stops.map(([t, [r, g, b]]) => `rgb(${r}, ${g}, ${b}) ${t * 100}%`).join(", ");
}

/**
 * Static price legend. Sits between the filter panel and the map so users
 * can decode the hex colors at a glance without it occupying space inside
 * the filter list (it's not a filter — it's a key).
 */
export function HeatmapLegend({
  priceMin,
  priceMax,
}: {
  priceMin: number;
  priceMax: number;
}) {
  const t = useT();
  return (
    <div className="shrink-0 border-b border-border bg-bg-card px-4 md:px-6 py-3">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="text-label font-medium uppercase tracking-wide text-fg-muted shrink-0">
          {t("legend.title")}
        </div>
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <span className="text-label text-fg-subtle shrink-0">
            {formatCOPShort(priceMin)}
          </span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background: `linear-gradient(to right, ${stopsToCssGradient(PRICE_STOPS)})`,
            }}
          />
          <span className="text-label text-fg-subtle shrink-0">
            {formatCOPShort(priceMax)}
          </span>
        </div>
      </div>
    </div>
  );
}
