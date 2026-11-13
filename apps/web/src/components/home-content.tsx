"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { CtaButtons } from "@/components/cta-buttons";
import { Emblem } from "@/components/emblem";
import { buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cx } from "@/lib/cx";
import { useLanguage } from "@/lib/i18n";

export type HomeAnnouncement = {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string | null;
  createdAt: string;
};

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cx("scroll-mt-20 border-t border-canvas-border py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-gold-400">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-display tracking-wider text-parchment-50">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-stone-400 font-serif">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="mt-8 sm:mt-12">{children}</div>
      </div>
    </section>
  );
}

export function HomeContent({
  announcements,
}: {
  announcements: HomeAnnouncement[];
}) {
  const { status } = useAuth();
  const { t } = useLanguage();
  const authed = status === "authenticated";

  return (
    <div className="pb-28 sm:pb-0">
      {/* SECTION 1: CINEMATIC HERO — THE GATES OF DRAGONHOLD */}
      <section className="relative min-h-[calc(100svh-3.5rem)] sm:min-h-[88vh] flex flex-col justify-end overflow-hidden border-b border-canvas-border">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-gates.jpg"
            alt={t.home.heroAlt}
            className="h-full w-full object-cover object-center filter brightness-85 contrast-110 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas-base via-canvas-base/60 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-canvas-base/90 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-12 pt-28 sm:pb-20 sm:pt-36 flex flex-col items-center text-center">
          <div className="relative mb-5 p-3.5 border border-gold-sovereign/40 bg-canvas-base/80 backdrop-blur-md shadow-[0_0_35px_rgba(200,162,83,0.2)]">
            <span className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-sovereign" />
            <Emblem className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-md" />
          </div>

          <div className="inline-flex max-w-full items-center gap-2 border border-gold-sovereign/40 bg-canvas-base/90 px-3 py-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest text-gold-300 backdrop-blur-sm shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-sovereign" />
            <span>{t.home.eraBadge}</span>
          </div>

          <h1 className="mt-4 text-[2rem] min-[360px]:text-4xl sm:text-6xl md:text-7xl font-display tracking-[0.12em] sm:tracking-widest text-parchment-50 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            {t.common.dragonhold}
          </h1>

          <p className="mt-3 font-serif text-lg sm:text-2xl text-gold-300 drop-shadow-md">
            {t.home.subtitle}
          </p>

          <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-stone-300 drop-shadow">
            {t.home.description}
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            {authed ? (
              <Link
                href="/dashboard"
                className={cx(
                  buttonStyles({ size: "lg" }),
                  "w-full sm:w-auto px-8 text-center text-sm tracking-wider font-bold shadow-xl",
                )}
              >
                {t.home.openYourRecord}
              </Link>
            ) : (
              <Link
                href="/register"
                className={cx(
                  buttonStyles({ size: "lg" }),
                  "w-full sm:w-auto px-8 text-center text-sm tracking-wider font-bold shadow-xl",
                )}
              >
                {t.common.enterKingdom}
              </Link>
            )}
            <Link
              href="#chapter"
              className={cx(
                buttonStyles({ variant: "secondary", size: "lg" }),
                "w-full sm:w-auto px-6 text-center text-sm",
              )}
            >
              {t.common.exploreWorld}
            </Link>
          </div>

          {/* Canonical 3-Stat Realm HUD */}
          <div className="mt-10 grid w-full max-w-lg grid-cols-3 divide-x divide-canvas-border border border-canvas-border bg-canvas-base/90 p-1 sm:p-3 text-center text-xs backdrop-blur-md shadow-2xl">
            <div className="min-w-0 p-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                {t.home.hud.throneLabel}
              </p>
              <p className="mt-0.5 break-words font-sans text-[11px] font-bold leading-tight text-amber-400 sm:text-sm">
                {t.home.hud.throneValue}
              </p>
              <p className="hidden text-[9px] text-stone-500 sm:block">
                {t.home.hud.throneSub}
              </p>
            </div>
            <div className="min-w-0 p-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                {t.home.hud.statusLabel}
              </p>
              <p className="mt-0.5 break-words font-sans text-[11px] font-bold leading-tight text-emerald-400 sm:text-sm">
                {t.home.hud.statusValue}
              </p>
              <p className="hidden text-[9px] text-stone-500 sm:block">
                {t.home.hud.statusSub}
              </p>
            </div>
            <div className="min-w-0 p-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                {t.home.hud.chroniclesLabel}
              </p>
              <p className="mt-0.5 break-words font-sans text-[11px] font-bold leading-tight text-gold-300 sm:text-sm">
                {t.home.hud.chroniclesValue}
              </p>
              <p className="hidden text-[9px] text-stone-500 sm:block">
                {t.home.hud.chroniclesSub}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURED STORY / CURRENT CHAPTER — EPISODE 001 */}
      <section
        id="chapter"
        className="scroll-mt-20 border-t border-canvas-border py-16 sm:py-24 bg-canvas-surface/60"
      >
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="relative overflow-hidden border border-gold-sovereign/30 bg-canvas-base shadow-2xl lg:col-span-7 group">
              <div className="aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
                <img
                  src="/images/episode-001.jpg"
                  alt={t.home.chapter.imageAlt}
                  className="h-full w-full object-cover filter brightness-90 contrast-105 transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-canvas-base via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-gold-300">
                <span className="hidden sm:inline bg-canvas-base/80 px-2 py-1 border border-gold-sovereign/40">
                  {t.home.chapter.coverBadge}
                </span>
                <span className="bg-canvas-base/80 px-2 py-1 border border-gold-sovereign/40">
                  {t.home.chapter.episodeBadge}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center lg:col-span-5">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gold-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-sovereign" />
                <span>{t.home.chapter.eyebrow}</span>
              </div>

              <h2 className="mt-2 text-2xl sm:text-3xl font-display tracking-wider text-parchment-50 leading-tight">
                {t.home.chapter.title}
              </h2>

              <p className="mt-4 font-serif text-base leading-relaxed text-stone-300">
                {t.home.chapter.lead}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                {t.home.chapter.body}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="#announcements"
                  className={cx(buttonStyles({ variant: "secondary", size: "md" }), "text-xs")}
                >
                  {t.home.chapter.readProclamations}
                </Link>
                {!authed ? (
                  <Link
                    href="/register"
                    className={cx(buttonStyles({ size: "md" }), "text-xs")}
                  >
                    {t.home.chapter.joinChronicle}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WORLD OF AETHERIAL */}
      <Section
        id="world"
        eyebrow={t.home.world.eyebrow}
        title={t.home.world.title}
        subtitle={t.home.world.subtitle}
      >
        <ol className="relative space-y-0 border-l border-gold-sovereign/40 pl-6 sm:pl-8">
          {t.home.world.stages.map((stage) => (
            <li key={stage.num} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[33px] sm:-left-[41px] top-0 flex h-6 w-6 items-center justify-center border border-gold-sovereign bg-canvas-base font-mono text-[10px] text-gold-300">
                {stage.num}
              </span>
              <h3 className="font-display text-lg text-parchment-50">{stage.title}</h3>
              <p className="mt-1 max-w-xl font-serif text-sm sm:text-base leading-relaxed text-stone-400">
                {stage.desc}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* SECTION 4: THE KINGDOM'S CURRENT STATE */}
      <Section
        id="kingdom"
        eyebrow={t.home.kingdom.eyebrow}
        title={t.home.kingdom.title}
        subtitle={t.home.kingdom.subtitle}
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="border border-canvas-border bg-canvas-surface p-6 sm:p-8 lg:col-span-7 shadow-xl">
            <span className="font-mono text-xs uppercase tracking-widest text-gold-400">
              {t.home.kingdom.interregnum}
            </span>
            <h3 className="mt-2 text-2xl font-display text-parchment-50">
              {t.home.kingdom.crownTitle}
            </h3>
            <div className="mt-4 space-y-3 font-serif text-sm sm:text-base leading-relaxed text-stone-300">
              <p>{t.home.kingdom.crownP1}</p>
              <p>{t.home.kingdom.crownP2}</p>
            </div>
          </div>

          <div className="border border-gold-sovereign/30 bg-canvas-base p-6 sm:p-8 lg:col-span-5 shadow-2xl relative">
            <span className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-sovereign" />

            <h4 className="font-display text-lg text-gold-300 uppercase tracking-wider">
              {t.home.kingdom.matrixTitle}
            </h4>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2.5">
                <dt className="text-stone-400">{t.home.kingdom.matrix.kingdomStatus}</dt>
                <dd className="font-mono font-bold text-emerald-400">
                  {t.home.kingdom.matrix.kingdomStatusVal}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2.5">
                <dt className="text-stone-400">{t.home.kingdom.matrix.highThrone}</dt>
                <dd className="font-mono font-bold text-amber-400">
                  {t.home.kingdom.matrix.highThroneVal}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2.5">
                <dt className="text-stone-400">{t.home.kingdom.matrix.sovereignOffice}</dt>
                <dd className="text-stone-300">{t.home.kingdom.matrix.sovereignOfficeVal}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2.5">
                <dt className="text-stone-400">{t.home.kingdom.matrix.realmChronicles}</dt>
                <dd className="font-mono text-gold-300">
                  {t.home.kingdom.matrix.realmChroniclesVal}
                </dd>
              </div>
              <div className="flex justify-between gap-4 pt-1">
                <dt className="text-stone-400">{t.home.kingdom.matrix.currentChapter}</dt>
                <dd className="text-stone-300">{t.home.kingdom.matrix.currentChapterVal}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      {/* SECTION 5: BECOME PART OF THE CHRONICLE */}
      <section
        id="participate"
        className="scroll-mt-20 border-t border-canvas-border bg-gradient-to-b from-canvas-surface to-canvas-base px-4 py-16 sm:py-24"
      >
        <div className="parchment-sheet relative mx-auto max-w-3xl px-5 py-10 text-center sm:px-12 sm:py-14">
          <div
            aria-hidden
            className="wax-seal absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full text-parchment-50"
          >
            <span className="font-display text-base font-bold">DH</span>
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-[#633f19]">
            {t.home.participate.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-2xl tracking-wider text-[#1f1d1a] sm:text-4xl">
            {t.home.participate.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-serif text-base leading-relaxed text-[#2c2825] sm:text-lg">
            {t.home.participate.p1}
          </p>
          <p className="mt-3 text-sm text-[#4a453e]">
            {t.home.participate.p2Before}
            <span className="font-mono font-bold text-[#402d00]">DH-000001</span>
            {t.home.participate.p2After}
          </p>
          <div className="mt-8 flex justify-center">
            <CtaButtons />
          </div>
        </div>
      </section>

      {/* SECTION 6: LATEST ANNOUNCEMENTS */}
      <Section
        id="announcements"
        eyebrow={t.home.proclamations.eyebrow}
        title={t.home.proclamations.title}
        subtitle={t.home.proclamations.subtitle}
      >
        {announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="parchment-sheet relative p-6 sm:p-8 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#c2b28c] pb-3 mb-4">
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#633f19]">
                      📜 {item.category.replace(/_/g, " ")}
                    </span>
                    {item.publishedAt ? (
                      <p className="text-xs font-mono text-[#5c4300] mt-0.5">
                        {new Date(item.publishedAt).toLocaleDateString(t.localeCode, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    ) : null}
                  </div>
                  <div
                    aria-label="Official Imperial Seal"
                    className="wax-seal flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-parchment-50 shadow-md"
                  >
                    <span className="font-display text-sm font-bold">DH</span>
                  </div>
                </div>

                <h3 className="font-display text-2xl font-bold text-[#1f1d1a] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm sm:text-base leading-relaxed text-[#2c2825] font-serif">
                  {item.content}
                </p>

                <div className="mt-5 pt-3 border-t border-[#d4c49e] flex items-center justify-between text-xs text-[#5c4300] font-medium">
                  <span>{t.home.proclamations.officialFooter}</span>
                  <span className="font-mono uppercase text-[10px]">
                    {t.home.proclamations.published}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Panel variant="dark" brackets className="text-stone-300">
            <p className="font-display font-bold text-gold-400">
              {t.home.proclamations.emptyTitle}
            </p>
            <p className="mt-1 text-sm text-stone-400">
              {t.home.proclamations.emptyBody}
            </p>
          </Panel>
        )}
      </Section>

      {/* SECTION 7: PUBLIC MOBILE STICKY DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-gold-sovereign/30 bg-canvas-base/95 p-3.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden shadow-2xl">
        <div className="flex items-center gap-2.5 pl-1">
          <Emblem className="h-7 w-7" />
          <div className="text-left">
            <p className="font-display text-xs uppercase tracking-wider text-gold-400">
              {t.home.mobileDock.title}
            </p>
            <p className="font-sans text-[11px] text-stone-300">{t.home.mobileDock.sub}</p>
          </div>
        </div>
        <Link
          href={authed ? "/dashboard" : "/register"}
          className={cx(
            buttonStyles({ size: "md" }),
            "px-4 text-xs font-bold shadow-md",
          )}
        >
          {authed ? t.home.mobileDock.ctaAuthed : t.home.mobileDock.ctaAnon}
        </Link>
      </div>
    </div>
  );
}

