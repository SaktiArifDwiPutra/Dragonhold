import { useId, type InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, className, ...input }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-parchment-200">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          "w-full min-h-[46px] border-2 bg-navy-950 px-3.5 py-2.5 text-base sm:text-sm text-parchment-50 placeholder:text-stone-500 transition-colors focus:outline-none",
          error
            ? "border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/40"
            : "border-navy-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30",
          className,
        )}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-stone-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}