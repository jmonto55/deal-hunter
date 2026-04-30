"use client";

import { useLocale } from "@/lib/i18n/provider";

/**
 * Floating pill that shows how many properties match the active filters.
 * Lives over the map's top-left corner instead of the filter header so the
 * count stays visible on mobile when filters are scrolled below the map.
 */
export function MatchCount({ matched, total }: { matched: number; total: number }) {
  const { t, fmt } = useLocale();
  return (
    <div
      className="absolute top-3 left-3 z-10 rounded-full bg-bg-card px-3 py-1.5 text-label text-fg-muted pointer-events-none"
      style={{ boxShadow: "var(--shadow-neu-sm)" }}
    >
      <span className="text-fg font-semibold">{fmt(matched)}</span>
      {` ${t("panel.matchSeparator")} `}
      <span className="text-fg font-semibold">{fmt(total)}</span>
      {` ${t("panel.matchSuffix")}`}
    </div>
  );
}
