import { FilterPanel } from "@/components/filter-panel";
import { MapView } from "@/components/map-view";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col md:flex-row min-h-0">
      <FilterPanel />
      <section className="relative flex-1 min-h-[60vh] md:min-h-0">
        <MapView />
      </section>
    </main>
  );
}
