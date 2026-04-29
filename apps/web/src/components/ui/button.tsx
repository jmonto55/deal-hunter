"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-neu-sm)] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-action text-action-fg hover:brightness-110 active:brightness-95",
        urgent: "bg-urgent text-urgent-fg hover:brightness-105 active:brightness-95",
        ghost: "text-fg hover:bg-bg-card",
        outline: "border border-border text-fg hover:bg-bg-card",
        /* Neumorphic — raised at rest, pressed-in on active. The `bg-bg-base`
         * is critical: the shadow trick only reads correctly when the surface
         * matches the parent. */
        neu: "bg-bg-base text-fg shadow-neu-sm hover:brightness-[1.02] active:shadow-neu-pressed active:translate-y-[1px]",
        "neu-action":
          "bg-action text-action-fg shadow-neu-sm hover:brightness-110 active:shadow-neu-pressed active:translate-y-[1px]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-cta",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});

export { buttonVariants };
