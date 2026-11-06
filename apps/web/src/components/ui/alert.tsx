import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Alert({
  variant = "error",
  children,
}: {
  variant?: "error" | "info";
  children: ReactNode;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cx(
        "border-2 px-4 py-3 text-sm",
        variant === "error"
          ? "border-burgundy-500 bg-burgundy-600/30 text-red-100"
          : "border-forest-500 bg-forest-600/30 text-parchment-100",
      )}
    >
      {children}
    </div>
  );
}