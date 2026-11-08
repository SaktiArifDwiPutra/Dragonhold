import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

// Reusable styles for <button> and styled <Link>
export function buttonStyles({
  variant = "primary",
  size = "md",
}: { variant?: Variant; size?: Size } = {}) {
  return cx(
    "inline-flex max-w-full items-center justify-center gap-2 text-center leading-tight font-sans select-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    "border-2 uppercase tracking-wider font-semibold",
    size === "md"
      ? "min-h-11 px-4 py-2 text-xs sm:text-[13px]"
      : "min-h-12 px-6 py-3 text-[13px] sm:text-sm font-bold",
    variant === "primary" &&
      "border-gold-300 bg-gradient-to-b from-gold-300 via-gold-500 to-gold-600 text-canvas-base shadow-[0_3px_0_0_#6b4e18] hover:brightness-105 active:translate-y-0.5 active:shadow-none",
    variant === "secondary" &&
      "border-[#8c6239] bg-canvas-surface text-gold-300 shadow-[0_2px_0_0_#0a0e18] hover:bg-canvas-subtle hover:border-gold-sovereign active:translate-y-0.5 active:shadow-none",
    variant === "ghost" &&
      "border-transparent bg-transparent text-stone-300 hover:text-gold-300 hover:bg-white/5",
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
