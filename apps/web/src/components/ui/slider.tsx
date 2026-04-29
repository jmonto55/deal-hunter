"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Neumorphic double-thumb range slider.
 * - Track is inset (recessed groove).
 * - Range fill uses --slider-range (action blue).
 * - Thumbs flip color per theme via --slider-thumb so they always contrast the track.
 */
export const Slider = forwardRef<
  ElementRef<typeof SliderPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(function Slider({ className, ...props }, ref) {
  const value = (props.value ?? props.defaultValue ?? [0]) as number[];
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track
        className="relative h-2 w-full grow overflow-hidden rounded-full"
        style={{
          background: "var(--slider-track)",
          boxShadow: "var(--shadow-neu-pressed)",
        }}
      >
        <SliderPrimitive.Range
          className="absolute h-full"
          style={{ background: "var(--slider-range)" }}
        />
      </SliderPrimitive.Track>
      {value.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block size-5 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40 disabled:pointer-events-none disabled:opacity-50 hover:scale-110"
          style={{
            background: "var(--slider-thumb)",
            boxShadow:
              "0 0 0 1px var(--slider-thumb-ring), 2px 2px 6px var(--neu-dark), -2px -2px 6px var(--neu-light)",
          }}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
