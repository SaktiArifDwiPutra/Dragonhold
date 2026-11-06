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
    "inline-flex items-center justify-center gap-2 font-display tracking-wide select-none",
    "border-2 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    size === "md" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base",
    variant === "primary" &&
      "border-gold-600 bg-gold-500 text-navy-950 hover:bg-gold-400",
    variant === "secondary" &&
      "border-gold-600/70 bg-transparent text-gold-300 hover:bg-gold-500/10",
    variant === "ghost" &&
      "border-transparent bg-transparent text-parchment-200 hover:text-gold-300",
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