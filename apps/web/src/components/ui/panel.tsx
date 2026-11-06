import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "dark" | "parchment";
};

export function Panel({ variant = "dark", className, ...props }: PanelProps) {
  return (
    <div
      className={cx(
        "border-2 p-6",
        variant === "parchment"
          ? "border-gold-600 bg-parchment-100 text-ink [&_h2]:text-ink [&_h3]:text-ink"
          : "border-navy-700 bg-navy-900 text-parchment-100",
        className,
      )}
      {...props}
    />
  );
}