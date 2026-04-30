"use client";

import { Slider } from "@/components/ui/slider";
import { useT } from "@/lib/i18n/provider";

const STEP = 10_000_000;

function formatCOP(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

export function PriceRangeFilter({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
}) {
  const t = useT();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-label font-medium uppercase tracking-wide text-fg-muted">
          {t("filter.priceLabel")}
        </label>
      </div>

      <div className="flex items-baseline justify-between text-fg">
        <span className="text-body font-semibold">{formatCOP(value[0])}</span>
        <span className="text-body font-semibold">{formatCOP(value[1])}</span>
      </div>

      <Slider
        min={min}
        max={max}
        step={STEP}
        value={value}
        onValueChange={(v) => onChange([v[0], v[1]] as [number, number])}
        minStepsBetweenThumbs={1}
        className="py-2"
        aria-label={t("filter.priceAria")}
      />

      <div className="flex items-baseline justify-between text-label text-fg-subtle">
        <span>{formatCOP(min)}</span>
        <span>{formatCOP(max)}</span>
      </div>
    </div>
  );
}
