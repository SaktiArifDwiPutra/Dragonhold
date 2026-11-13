"use client";

import Link from "next/link";
import { Emblem } from "@/components/emblem";
import { buttonStyles } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <Emblem className="h-14 w-14 opacity-80" />
      <p className="font-mono text-xs uppercase tracking-widest text-gold-400">
        {t.notFound.eyebrow}
      </p>
      <h1 className="font-display text-3xl tracking-wider text-parchment-50">
        {t.notFound.title}
      </h1>
      <p className="max-w-sm font-serif text-stone-400">{t.notFound.body}</p>
      <Link href="/" className={buttonStyles()}>
        {t.notFound.cta}
      </Link>
    </div>
  );
}
