"use client";

import { Slider } from "@/components/ui/slider";
import { useT } from "@/lib/i18n/provider";

const STEP = 5;

export function AreaRangeFilter({
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
          {t("filter.areaLabel")}
        </label>
      </div>

      <div className="flex items-baseline justify-between text-fg">
        <span className="text-body font-semibold">{value[0]} m²</span>
        <span className="text-body font-semibold">{value[1]} m²</span>
      </div>

      <Slider
        min={min}
        max={max}
        step={STEP}
        value={value}
        onValueChange={(v) => onChange([v[0], v[1]] as [number, number])}
        minStepsBetweenThumbs={1}
        className="py-2"
        aria-label={t("filter.areaAria")}
      />

      <div className="flex items-baseline justify-between text-label text-fg-subtle">
        <span>{min} m²</span>
        <span>{max} m²</span>
      </div>
    </div>
  );
}
