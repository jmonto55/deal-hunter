"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocale } from "@/lib/i18n/provider";
import { Slider } from "@/components/ui/slider";
import {
  computeTimeline,
  computeModelSummary,
  computeBenchmarkTimeline,
  getMarketData,
  getModelMaxMonths,
  MODEL_RISKS,
  MIN_MONTHS,
  MAX_MONTHS,
  CAPITAL_GAIN_MAX_MONTHS,
  BENCHMARK_ANNUAL_RATE,
  type BusinessModel,
  type RiskLevel,
  type Risk,
} from "@/lib/analysis";
import { Switch } from "@/components/ui/switch";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/messages";

// ─── Types ─────────────────────────────────────────────────────────────────

export type PropertyParams = {
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  neighborhood: string;
  type: string;
};

// ─── Model metadata ────────────────────────────────────────────────────────

const MODEL_OPTIONS: {
  value: BusinessModel;
  labelKey: MessageKey;
  descKey: MessageKey;
}[] = [
  { value: "flipping", labelKey: "analysis.model.flipping", descKey: "analysis.model.flipping.desc" },
  { value: "buySell",  labelKey: "analysis.model.buySell",  descKey: "analysis.model.buySell.desc"  },
  { value: "coliving", labelKey: "analysis.model.coliving", descKey: "analysis.model.coliving.desc" },
  { value: "buyRent",  labelKey: "analysis.model.buyRent",  descKey: "analysis.model.buyRent.desc"  },
];

// ─── Formatting helpers ────────────────────────────────────────────────────

function formatCOP(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000)     return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${abs.toLocaleString("en-US")}`;
}

function formatMonths(m: number): string {
  const years  = Math.floor(m / 12);
  const months = m % 12;
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}a`;
  return `${years}a ${months}m`;
}

// ─── SVG chart ─────────────────────────────────────────────────────────────

const VW = 600;
const VH = 220;
const PAD = { top: 16, right: 20, bottom: 36, left: 72 };
const CW = VW - PAD.left - PAD.right; // 508
const CH = VH - PAD.top - PAD.bottom; // 168

type ChartPoint = { month: number; profit: number; roiPct: number };

function InvestmentChart({
  data,
  activeMonth,
  benchmark,
  maxMonths = MAX_MONTHS,
  showRiskZone = false,
}: {
  data: ChartPoint[];
  activeMonth: number;
  benchmark?: ChartPoint[];
  maxMonths?: number;
  showRiskZone?: boolean;
}) {
  if (data.length === 0) return null;

  const allProfits = [
    ...data.map((d) => d.profit),
    ...(benchmark ?? []).map((d) => d.profit),
    0,
  ];
  const profits = data.map((d) => d.profit);
  const rawMin  = Math.min(...allProfits);
  const rawMax  = Math.max(...allProfits);
  // Add 8% padding top/bottom so points don't sit flush on edges
  const pad     = Math.max((rawMax - rawMin) * 0.08, 1);
  const yMin    = rawMin - pad;
  const yMax    = rawMax + pad;
  const yRange  = yMax - yMin;

  const xScale  = (m: number) => ((m - MIN_MONTHS) / (maxMonths - MIN_MONTHS)) * CW + PAD.left;
  const yScale  = (p: number) => PAD.top + CH - ((p - yMin) / yRange) * CH;
  const zeroY   = yScale(0);

  // Build SVG polyline points
  const linePts = data.map((d) => `${xScale(d.month).toFixed(1)},${yScale(d.profit).toFixed(1)}`).join(" ");

  // Area fill: close back along zero line
  const firstX = xScale(data[0]!.month);
  const lastX  = xScale(data[data.length - 1]!.month);
  const areaD  = `M ${firstX} ${zeroY} L ${data.map((d) => `${xScale(d.month).toFixed(1)},${yScale(d.profit).toFixed(1)}`).join(" L ")} L ${lastX} ${zeroY} Z`;

  // Active month marker
  const activePoint = data.find((d) => d.month === activeMonth) ?? data[data.length - 1]!;
  const ax = xScale(activePoint.month);
  const ay = yScale(activePoint.profit);

  // Y-axis labels: 4 ticks
  const yTicks = [0, 0.33, 0.66, 1].map((t) => yMin + t * yRange);

  // X-axis labels — denser for 24-month range
  const xLabelStep = maxMonths <= 24 ? 6 : 12;
  const xLabels: number[] = [];
  for (let m = xLabelStep; m <= maxMonths; m += xLabelStep) {
    if (m >= MIN_MONTHS) xLabels.push(m);
  }

  // Risk zone: months 18–24 for capital-gain models
  const riskZoneStartX = showRiskZone ? xScale(18) : null;
  const riskZoneEndX   = showRiskZone ? xScale(maxMonths) : null;

  const isPositive = activePoint.profit >= 0;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full h-auto"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--action)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--action)" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="areaGradNeg" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--urgent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--urgent)" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Y-axis grid + labels */}
      {yTicks.map((v, i) => {
        const y = yScale(v);
        return (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={y}
              x2={PAD.left + CW}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray={v === 0 ? "none" : "3 3"}
            />
            <text
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="9"
              fill="var(--fg-subtle)"
            >
              {formatCOP(v)}
            </text>
          </g>
        );
      })}

      {/* Zero line — solid, slightly more visible */}
      <line
        x1={PAD.left}
        y1={zeroY}
        x2={PAD.left + CW}
        y2={zeroY}
        stroke="var(--fg-subtle)"
        strokeWidth="1"
      />

      {/* X-axis labels */}
      {xLabels.map((m) => (
        <text
          key={m}
          x={xScale(m)}
          y={VH - 6}
          textAnchor="middle"
          fontSize="9"
          fill="var(--fg-subtle)"
        >
          {m < 12 ? `${m}m` : m % 12 === 0 ? `${m/12}a` : `${Math.floor(m/12)}a${m%12}m`}
        </text>
      ))}

      {/* Risk zone — shaded warning area for capital-gain models */}
      {riskZoneStartX !== null && riskZoneEndX !== null && (
        <rect
          x={riskZoneStartX}
          y={PAD.top}
          width={riskZoneEndX - riskZoneStartX}
          height={CH}
          fill="#ef4444"
          fillOpacity="0.06"
        />
      )}
      {riskZoneStartX !== null && (
        <line
          x1={riskZoneStartX}
          y1={PAD.top}
          x2={riskZoneStartX}
          y2={PAD.top + CH}
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="3 2"
          strokeOpacity="0.5"
        />
      )}

      {/* Area fill */}
      <path d={areaD} fill={isPositive ? "url(#areaGrad)" : "url(#areaGradNeg)"} />

      {/* Benchmark line */}
      {benchmark && benchmark.length > 0 && (() => {
        const bPts = benchmark
          .map((d) => `${xScale(d.month).toFixed(1)},${yScale(d.profit).toFixed(1)}`)
          .join(" ");
        return (
          <polyline
            points={bPts}
            fill="none"
            stroke="var(--fg-muted)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            strokeLinejoin="round"
          />
        );
      })()}

      {/* Legend */}
      {benchmark && (
        <g>
          <line x1={PAD.left + 4} y1={PAD.top + 8} x2={PAD.left + 18} y2={PAD.top + 8}
            stroke={isPositive ? "var(--action)" : "var(--urgent)"} strokeWidth="2" />
          <text x={PAD.left + 22} y={PAD.top + 12} fontSize="8" fill="var(--fg-muted)">Modelo</text>
          <line x1={PAD.left + 60} y1={PAD.top + 8} x2={PAD.left + 74} y2={PAD.top + 8}
            stroke="var(--fg-muted)" strokeWidth="1.5" strokeDasharray="5 3" />
          <text x={PAD.left + 78} y={PAD.top + 12} fontSize="8" fill="var(--fg-muted)">CDT ~10.5% EA</text>
        </g>
      )}

      {/* Main line */}
      <polyline
        points={linePts}
        fill="none"
        stroke={isPositive ? "var(--action)" : "var(--urgent)"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Active-month cursor */}
      <line
        x1={ax}
        y1={PAD.top}
        x2={ax}
        y2={PAD.top + CH}
        stroke="var(--fg-muted)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <circle
        cx={ax}
        cy={ay}
        r="5"
        fill={isPositive ? "var(--action)" : "var(--urgent)"}
        stroke="var(--bg-card)"
        strokeWidth="2"
      />

      {/* Tooltip bubble */}
      <g transform={`translate(${ax},${ay})`}>
        {(() => {
          const label = `${formatCOP(activePoint.profit)}  (${activePoint.roiPct >= 0 ? "+" : ""}${activePoint.roiPct.toFixed(1)}%)`;
          const bW = label.length * 5.8 + 12;
          const bH = 18;
          const bX = ax + bW + 8 > VW ? -bW - 6 : 6;
          const bY = ay - 28 < PAD.top ? 6 : -bH - 4;
          return (
            <>
              <rect
                x={bX}
                y={bY}
                width={bW}
                height={bH}
                rx="4"
                fill="var(--bg-elevated)"
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={bX + 6}
                y={bY + 12}
                fontSize="9"
                fill={isPositive ? "var(--action)" : "var(--urgent)"}
                fontWeight="600"
              >
                {label}
              </text>
            </>
          );
        })()}
      </g>
    </svg>
  );
}

// ─── Risk section ──────────────────────────────────────────────────────────

const RISK_META: Record<RiskLevel, { dot: string; badge: string; label: string }> = {
  high:   { dot: "#ef4444", badge: "bg-red-500/10",   label: "ALTO"  },
  medium: { dot: "#F5A623", badge: "bg-urgent/10",    label: "MEDIO" },
  low:    { dot: "#22c55e", badge: "bg-green-500/10", label: "BAJO"  },
};

function RiskSection({ model, locale }: { model: BusinessModel; locale: Locale }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const risks = MODEL_RISKS[model];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-label font-medium text-fg-muted">Riesgos del modelo</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {risks.map((risk, i) => {
          const { dot, badge, label } = RISK_META[risk.level];
          const isOpen = openIdx === i;
          return (
            <button
              key={risk.label.es}
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="rounded-[var(--radius-neu-sm)] border border-border bg-bg-base p-3 text-left transition-colors hover:bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40"
            >
              {/* Header row */}
              <div className="flex items-center gap-2.5">
                <span className="block size-2.5 rounded-full shrink-0" style={{ background: dot }} />
                <span className="text-xs font-semibold text-fg flex-1 leading-snug">
                  {risk.label[locale]}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${badge}`}
                  style={{ color: dot }}
                >
                  {label}
                </span>
                <span className="text-fg-subtle text-xs shrink-0">{isOpen ? "▲" : "▼"}</span>
              </div>

              {/* Expandable description */}
              {isOpen && (
                <p className="mt-2 text-label text-fg-muted leading-relaxed border-t border-border pt-2">
                  {risk.description[locale]}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stat pill ─────────────────────────────────────────────────────────────

function StatPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[var(--radius-neu-sm)] border border-border bg-bg-base px-3 py-2 min-w-0">
      <span className="text-label text-fg-subtle truncate">{label}</span>
      <span className={`text-sm font-semibold truncate ${accent ? "text-action" : "text-fg"}`}>{value}</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function BusinessAnalysis({ property }: { property: PropertyParams }) {
  const { t, locale } = useLocale();
  const [model, setModel]         = useState<BusinessModel | "">("");
  const [months, setMonths]       = useState(36);
  const [showBenchmark, setShowBenchmark] = useState(false);

  const selected = MODEL_OPTIONS.find((m) => m.value === model) ?? null;
  const sliderMax = model ? getModelMaxMonths(model as BusinessModel) : MAX_MONTHS;
  const isCapitalGain = model === "flipping" || model === "buySell";

  // Clamp selected month when switching to a shorter-range model
  useEffect(() => {
    if (months > sliderMax) setMonths(sliderMax);
  }, [sliderMax, months]);

  const timeline = useMemo(() => {
    if (!model) return [];
    return computeTimeline(model as BusinessModel, property);
  }, [model, property]);

  const summary = useMemo(() => {
    if (!model) return null;
    return computeModelSummary(model as BusinessModel, property);
  }, [model, property]);

  const market = useMemo(() => getMarketData(property.neighborhood), [property.neighborhood]);

  const activePoint = timeline.find((p) => p.month === months) ?? timeline[timeline.length - 1];

  const benchmarkTimeline = useMemo(() => {
    if (!showBenchmark || !summary) return undefined;
    return computeBenchmarkTimeline(summary.totalInvested, MAX_MONTHS);
  }, [showBenchmark, summary]);

  const activeBenchmark = benchmarkTimeline?.find((p) => p.month === months)
    ?? benchmarkTimeline?.[benchmarkTimeline.length - 1];

  return (
    <div className="flex flex-col gap-5 w-full max-w-3xl mx-auto px-4 py-6">

      {/* Model selector */}
      <div className="flex flex-col gap-2">
        <label htmlFor="business-model" className="text-label font-medium text-fg-muted">
          {t("analysis.modelLabel")}
        </label>
        <select
          id="business-model"
          value={model}
          onChange={(e) => setModel(e.target.value as BusinessModel | "")}
          className="h-10 rounded-[var(--radius-neu-sm)] border border-border bg-bg-card text-fg pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-action/40"
        >
          <option value="" disabled>—</option>
          {MODEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
          ))}
        </select>
        {selected && (
          <p className="text-label text-fg-muted leading-relaxed">{t(selected.descKey)}</p>
        )}

        {/* Benchmark toggle — only shown once a model is selected */}
        {model && (
          <div className="flex items-center gap-2.5 pt-1">
            <Switch
              id="benchmark-toggle"
              checked={showBenchmark}
              onCheckedChange={setShowBenchmark}
            />
            <label htmlFor="benchmark-toggle" className="text-label text-fg-muted cursor-pointer select-none">
              {t("analysis.compareToggle")}{" "}
              <span className="text-fg-subtle">
                ({(BENCHMARK_ANNUAL_RATE * 100).toFixed(1)}% EA)
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Stats row */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatPill
            label="Precio compra"
            value={formatCOP(property.price)}
          />
          <StatPill
            label="Total invertido"
            value={formatCOP(summary.totalInvested)}
          />
          <StatPill
            label="Ref. mercado m²"
            value={`${formatCOP(market.avgPricePerM2)}/m²`}
          />
          {summary.monthlyIncome > 0 ? (
            <StatPill
              label="Ingreso mensual"
              value={`${formatCOP(summary.monthlyIncome)}/mes`}
            />
          ) : (
            <StatPill
              label="Ref. arriendo m²"
              value={`${formatCOP(market.avgRentPerM2)}/m²`}
            />
          )}
        </div>
      )}

      {/* Chart + slider */}
      {timeline.length > 0 ? (
        <div className="rounded-[var(--radius-neu)] border border-border bg-bg-card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-label font-medium text-fg-muted">{t("analysis.chartTitle")}</span>
            <span className="text-label font-semibold text-fg">
              {formatMonths(months)}
              {activePoint && (
                <span className={`ml-2 ${activePoint.profit >= 0 ? "text-action" : "text-urgent"}`}>
                  {activePoint.profit >= 0 ? "+" : ""}
                  {activePoint.roiPct.toFixed(1)}% ROI
                </span>
              )}
            </span>
          </div>

          <InvestmentChart
            data={timeline}
            activeMonth={months}
            benchmark={benchmarkTimeline}
            maxMonths={sliderMax}
            showRiskZone={isCapitalGain}
          />

          {/* Slider */}
          <div className="flex items-center gap-3 px-1">
            <span className="text-label text-fg-subtle w-6 shrink-0">{MIN_MONTHS}m</span>
            <Slider
              min={MIN_MONTHS}
              max={sliderMax}
              step={1}
              value={[months]}
              onValueChange={([v]) => v !== undefined && setMonths(v)}
              className="flex-1"
            />
            <span className="text-label text-fg-subtle w-10 shrink-0 text-right">
              {formatMonths(sliderMax)}
            </span>
          </div>

          {/* Capital-gain risk warning at 2-year boundary */}
          {isCapitalGain && months >= 20 && (
            <div className="rounded-[var(--radius-neu-sm)] px-3 py-2 text-xs font-medium text-center bg-red-500/10 text-red-400 border border-red-500/20">
              ⚠ Zona de riesgo — a los 2 años la combinación de costos de tenencia y descuento por tiempo sin vender puede llevar a cerrar por debajo del costo de adquisición.
            </div>
          )}

          {/* Profit callout */}
          {activePoint && (
            <div className="flex flex-col gap-1.5">
              <div className={`rounded-[var(--radius-neu-sm)] px-3 py-2 text-sm font-medium text-center ${
                activePoint.profit >= 0 ? "bg-action/10 text-action" : "bg-urgent/10 text-urgent"
              }`}>
                {activePoint.profit >= 0 ? "Ganancia" : "Pérdida"} proyectada a {formatMonths(months)}:{" "}
                <span className="font-bold">{formatCOP(activePoint.profit)}</span>
              </div>

              {activeBenchmark && (() => {
                const diff = activePoint.profit - activeBenchmark.profit;
                const ahead = diff >= 0;
                return (
                  <div className={`rounded-[var(--radius-neu-sm)] px-3 py-2 text-sm font-medium text-center ${
                    ahead ? "bg-action/10 text-action" : "bg-urgent/10 text-urgent"
                  }`}>
                    {ahead ? t("analysis.advantage") : t("analysis.disadvantage")}{" "}
                    <span className="text-fg-muted font-normal">
                      ({t("analysis.benchmarkLabel")} = {formatCOP(activeBenchmark.profit)}):
                    </span>{" "}
                    <span className="font-bold">
                      {ahead ? "+" : ""}{formatCOP(diff)}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[var(--radius-neu)] border border-border bg-bg-card flex items-center justify-center min-h-64 text-label text-fg-muted">
          {t("analysis.chartEmpty")}
        </div>
      )}

      {/* Risks */}
      {model && <RiskSection model={model as BusinessModel} locale={locale} />}
    </div>
  );
}
