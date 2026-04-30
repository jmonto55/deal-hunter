"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Neumorphic toggle switch. Track is inset (recessed groove); thumb is a
 * raised disc that slides + flips color per state. When checked, the track
 * fills with action blue.
 */
export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40",
        "data-[state=checked]:bg-action data-[state=unchecked]:bg-bg-base disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      style={{ boxShadow: "var(--shadow-neu-pressed)" }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className="pointer-events-none block size-4 rounded-full bg-fg transition-transform data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0.5"
        style={{
          boxShadow:
            "0 0 0 1px var(--slider-thumb-ring), 1px 1px 3px var(--neu-dark)",
        }}
      />
    </SwitchPrimitive.Root>
  );
});
