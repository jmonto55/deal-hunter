"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";

/**
 * Toggles between Spanish (es) and English (en). Renders a placeholder on
 * SSR / pre-mount to avoid hydration mismatch — the locale only resolves
 * from localStorage on the client.
 */
export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const next: "en" | "es" = locale === "es" ? "en" : "es";
  const labelCurrent = mounted ? locale.toUpperCase() : "ES";

  return (
    <Button
      variant="neu"
      size="icon-sm"
      aria-label={t("nav.toggleLocale")}
      title={t("nav.toggleLocale")}
      onClick={() => setLocale(next)}
      disabled={!mounted}
      className="font-semibold text-xs"
    >
      {labelCurrent}
    </Button>
  );
}
