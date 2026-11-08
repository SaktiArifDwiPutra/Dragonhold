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
          ? "border-2 border-gold-600 bg-parchment-100 text-ink shadow-md [&_h2]:text-ink [&_h3]:text-ink"
          : variant === "hud"
            ? "border border-gold-500/40 bg-navy-950/90 text-parchment-100 shadow-xl backdrop-blur-sm"
            : "border border-navy-700 bg-navy-900/90 text-parchment-100 shadow-lg",
        className,
      )}
      {...props}
    >
      {isHud ? (
        <>
          <span className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-gold-400" />
          <span className="pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-gold-400" />
          <span className="pointer-events-none absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-gold-400" />
          <span className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-400" />
        </>
      ) : null}
      {children}
    </div>
  );
}