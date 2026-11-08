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
          ? "border-seal-crimson bg-seal-crimson/20 text-red-100 shadow-md"
          : "border-forest-500 bg-forest-600/20 text-emerald-100 shadow-md",
      )}
    >
      {children}
    </div>
  );
}
