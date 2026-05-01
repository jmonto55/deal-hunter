"use client";

import { useRef, useState } from "react";
import { Info } from "lucide-react";

/**
 * Info icon that opens a fixed-position popover to the right on hover/tap.
 * Uses getBoundingClientRect + position:fixed so it escapes any overflow
 * container (sidebar overflow-y-auto, map pointer-events-none overlay, etc.).
 */
export function InfoPopover({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const show = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.top + r.height / 2, left: r.right + 8 });
    }
    setOpen(true);
  };

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        type="button"
        className="pointer-events-auto text-fg-muted hover:text-fg transition-colors"
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onClick={show}
        aria-label="Más información"
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: "translateY(-50%)",
            width: 280,
            maxWidth: 280,
            zIndex: 50,
            padding: "12px 14px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "var(--shadow-neu-sm)",
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--fg)",
            whiteSpace: "normal",
            pointerEvents: "none",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
