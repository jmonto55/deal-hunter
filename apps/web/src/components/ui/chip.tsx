"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/**
 * Neumorphic toggle chip. Raised at rest, pressed-in when selected,
 * with action-blue text on the selected state to make multi-selects
 * read at a glance.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, selected = false, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-label font-medium transition-all duration-150",
        "bg-bg-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40",
        selected ? "text-action" : "text-fg-muted hover:text-fg",
        className,
      )}
      style={{
        boxShadow: selected ? "var(--shadow-neu-pressed)" : "var(--shadow-neu-sm)",
      }}
      {...props}
    >
      {children}
    </button>
  );
});
