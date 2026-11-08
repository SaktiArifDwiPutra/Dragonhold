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
      <label htmlFor={id} className="block text-sm font-medium text-parchment-200">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          "w-full min-h-[48px] border-2 bg-canvas-base px-4 py-2.5 text-base sm:text-sm text-parchment-50 placeholder:text-stone-500 transition-colors focus:outline-none",
          error
            ? "border-seal-crimson focus:ring-2 focus:ring-seal-crimson/40"
            : "border-canvas-border focus:border-gold-sovereign focus:ring-1 focus:ring-gold-sovereign",
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
