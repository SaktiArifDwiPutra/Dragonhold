"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, className, type, ...input }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-parchment-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            "block w-full min-h-12 border-2 bg-canvas-base px-4 py-2.5 text-base text-parchment-50 placeholder:text-stone-500 transition-colors focus:outline-none sm:text-sm",
            isPassword && "pr-14",
            error
              ? "border-seal-crimson focus:ring-2 focus:ring-seal-crimson/40"
              : "border-canvas-border focus:border-gold-sovereign focus:ring-1 focus:ring-gold-sovereign",
            className,
          )}
          {...input}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone-400 hover:text-gold-300"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {visible ? <path d="M4 4l16 16" /> : null}
            </svg>
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-stone-400 sm:text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
