"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";

const MIN = 60_000_000; // COP 60M
const MAX = 5_000_000_000; // COP 5B
const STEP = 10_000_000;

function formatCOP(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

export function PriceRangeFilter() {
  const [range, setRange] = useState<[number, number]>([1_210_000_000, 3_500_000_000]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-label font-medium uppercase tracking-wide text-fg-muted">
          Price range (COP)
        </label>
      </div>

      <div className="flex items-baseline justify-between text-fg">
        <span className="text-body font-semibold">{formatCOP(range[0])}</span>
        <span className="text-body font-semibold">{formatCOP(range[1])}</span>
      </div>

      <Slider
        min={MIN}
        max={MAX}
        step={STEP}
        value={range}
        onValueChange={(v) => setRange([v[0], v[1]] as [number, number])}
        minStepsBetweenThumbs={1}
        className="py-2"
        aria-label="Price range"
      />

      <div className="flex items-baseline justify-between text-label text-fg-subtle">
        <span>{formatCOP(MIN)}</span>
        <span>{formatCOP(MAX)}</span>
      </div>
    </div>
  );
}
