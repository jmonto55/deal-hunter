import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-[var(--radius-sm)] border border-border bg-bg-card px-4 py-3 text-body text-fg placeholder:text-fg-subtle transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-action/40 focus:border-action",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  },
);
