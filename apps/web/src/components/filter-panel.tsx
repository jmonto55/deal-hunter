import { PriceRangeFilter } from "@/components/price-range-filter";

export function FilterPanel() {
  return (
    <aside
      className="
        w-full md:w-80 lg:w-96 shrink-0
        border-b md:border-b-0 md:border-r border-border
        bg-bg-card
        p-6
        md:max-h-[calc(100vh-3.5rem)] md:overflow-y-auto
      "
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-h3 font-semibold text-fg">Medellín Properties</h2>
          <p className="text-label text-fg-muted">
            <span className="text-fg font-semibold">206</span> of 1,000 properties match filters
          </p>
        </div>

        <div
          className="rounded-[var(--radius-neu)] p-5 bg-bg-base"
          style={{ boxShadow: "var(--shadow-neu-sm)" }}
        >
          <PriceRangeFilter />
        </div>
      </div>
    </aside>
  );
}
