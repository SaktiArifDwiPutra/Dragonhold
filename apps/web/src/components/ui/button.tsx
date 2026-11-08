import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

// Dipisah supaya bisa dipakai juga untuk <Link> yang tampil seperti tombol
export function buttonStyles({
  variant = "primary",
  size = "md",
}: { variant?: Variant; size?: Size } = {}) {
  return cx(
    "inline-flex items-center justify-center gap-2 font-display uppercase tracking-wider select-none min-h-[44px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    "border-2",
    size === "md" ? "px-4 py-2 text-xs sm:text-sm font-semibold" : "px-6 py-3 text-sm sm:text-base font-bold",
    variant === "primary" &&
      "border-gold-300 bg-gradient-to-b from-gold-400 via-gold-500 to-gold-600 text-navy-950 font-bold shadow-[0_3px_0_0_#92400e] hover:brightness-105 active:translate-y-0.5 active:shadow-none",
    variant === "secondary" &&
      "border-gold-600/70 bg-navy-900/90 text-gold-300 shadow-[0_2px_0_0_#0f172a] hover:bg-gold-500/10 hover:border-gold-400 active:translate-y-0.5 active:shadow-none",
    variant === "ghost" &&
      "border-transparent bg-transparent text-parchment-200 hover:text-gold-300 hover:bg-white/5",
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonStyles({ variant, size }), className)}
      {...props}
    />
  );
}