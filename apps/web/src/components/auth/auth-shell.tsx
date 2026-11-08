import type { ReactNode } from "react";
import { Emblem } from "../emblem";

// Shared cinematic frame for login and registration
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden">
      <img
        src="/images/hero-gates.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-canvas-base/80" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas-base/40 via-canvas-base/70 to-canvas-base" />

      <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
        <div className="relative border border-gold-sovereign/40 bg-canvas-base/90 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
          <span aria-hidden className="pointer-events-none absolute -left-1 -top-1 h-2.5 w-2.5 border-l-2 border-t-2 border-gold-sovereign" />
          <span aria-hidden className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-sovereign" />
          <div className="flex items-center gap-3">
            <Emblem className="h-10 w-10 shrink-0" />
            <p className="min-w-0 font-mono text-[11px] uppercase tracking-widest text-gold-400">{eyebrow}</p>
          </div>
          <h1 className="mt-4 font-display text-2xl tracking-wider text-parchment-50 sm:text-3xl">{title}</h1>
          <p className="mt-2 font-serif text-sm leading-relaxed text-stone-400">{intro}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
