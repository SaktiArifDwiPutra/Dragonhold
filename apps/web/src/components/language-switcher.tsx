"use client";

import { cx } from "@/lib/cx";
import { useLanguage, type Locale } from "@/lib/i18n";

const OPTIONS: ReadonlyArray<{ code: Locale; label: string; title: string }> = [
  { code: "en", label: "EN", title: "English" },
  { code: "id", label: "ID", title: "Bahasa Indonesia" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.header.switchLanguage}
      className={cx(
        "inline-flex shrink-0 items-center border border-gold-sovereign/40 bg-canvas-surface p-0.5",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLang(opt.code)}
            aria-pressed={active}
            title={opt.title}
            className={cx(
              "flex min-h-10 min-w-10 items-center justify-center px-2 font-mono text-xs font-bold tracking-wider transition-colors sm:min-h-8 sm:min-w-8",
              active
                ? "bg-gold-sovereign text-canvas-base"
                : "text-stone-400 hover:text-gold-300",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

