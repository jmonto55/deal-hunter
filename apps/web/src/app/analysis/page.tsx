import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BusinessAnalysis } from "@/components/business-analysis";
import type { PropertyParams } from "@/components/business-analysis";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AnalysisPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const property: PropertyParams = {
    price: Number(params.price) || 0,
    area: Number(params.area) || 0,
    bedrooms: Number(params.bedrooms) || 0,
    bathrooms: Number(params.bathrooms) || 0,
    neighborhood: String(params.neighborhood ?? ""),
    type: String(params.type ?? ""),
  };

  return (
    <main className="flex flex-col flex-1">
      {/* Header */}
      <div className="border-b border-border bg-bg-card px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Volver</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-medium text-fg">Análisis de Inversión</h1>
        {property.neighborhood && (
          <>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-fg-muted">{property.neighborhood}</span>
          </>
        )}
      </div>

      <BusinessAnalysis property={property} />
    </main>
  );
}
