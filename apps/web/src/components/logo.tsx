import { cn } from "@/lib/utils";

/**
 * DealHunter logo: corner-bracket icon + wordmark.
 * Approximates the brand mark from the guidelines (stylized [ ] frame
 * suggesting a target / locator). Color flows from `currentColor` so it
 * inherits the surrounding text color — letting us render the brand-approved
 * "Invertida" (white-on-dark) and "Principal" (dark-on-light) variants
 * without per-theme assets.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-bold tracking-tight text-fg select-none",
        className,
      )}
    >
      <LogoMark className="size-6" />
      <span className="text-[18px]">DEALHUNTER</span>
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top-left bracket */}
      <rect x="2" y="2" width="6" height="2" fill="currentColor" />
      <rect x="2" y="2" width="2" height="6" fill="currentColor" />
      {/* Top-right bracket */}
      <rect x="16" y="2" width="6" height="2" fill="currentColor" />
      <rect x="20" y="2" width="2" height="6" fill="currentColor" />
      {/* Bottom-left bracket */}
      <rect x="2" y="16" width="2" height="6" fill="currentColor" />
      <rect x="2" y="20" width="6" height="2" fill="currentColor" />
      {/* Bottom-right bracket */}
      <rect x="20" y="16" width="2" height="6" fill="currentColor" />
      <rect x="16" y="20" width="6" height="2" fill="currentColor" />
      {/* Center accent */}
      <rect x="10" y="10" width="4" height="4" fill="currentColor" />
    </svg>
  );
}
