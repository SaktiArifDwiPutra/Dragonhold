import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "dark" | "parchment" | "hud";
  brackets?: boolean;
};

export function Panel({
  variant = "dark",
  brackets = false,
  className,
  children,
  ...props
}: PanelProps) {
  const isHud = variant === "hud" || brackets;
  return (
    <div
      className={cx(
        "relative p-5 sm:p-6 transition-all duration-200",
        variant === "parchment"
          ? "parchment-sheet text-ink [&_h2]:text-ink [&_h3]:text-ink [&_dt]:text-stone-700 [&_dd]:text-ink"
          : variant === "hud"
            ? "border border-gold-sovereign/40 bg-canvas-surface/95 text-stone-300 shadow-xl backdrop-blur-sm"
            : "border border-canvas-border bg-canvas-surface text-stone-300 shadow-lg",
        className,
      )}
      {...props}
    >
      {isHud ? (
        <>
          <span className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-gold-sovereign" />
          <span className="pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-gold-sovereign" />
          <span className="pointer-events-none absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-gold-sovereign" />
          <span className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-sovereign" />
        </>
      ) : null}
      {children}
    </div>
  );
}
