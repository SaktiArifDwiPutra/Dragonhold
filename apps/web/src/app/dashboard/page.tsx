"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Emblem } from "@/components/emblem";
import { Button, buttonStyles } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cx } from "@/lib/cx";

type Announcement = {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string | null;
  createdAt: string;
};

function PassRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#d4c49e] py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-[#5c4300]">{label}</dt>
      <dd className="min-w-0 break-all text-[#1f1d1a] [overflow-wrap:anywhere] sm:break-words sm:text-right">{children}</dd>
    </div>
  );
}

export default function DashboardPage() {
  const { status, me, logout } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    api<{ announcements: Announcement[] }>("/announcements")
      .then((res) => setAnnouncements(res.announcements ?? []))
      .catch(() => setAnnouncements([]));
  }, [status]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (status !== "authenticated" || !me) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Emblem className="h-12 w-12 animate-pulse" />
        <p className="font-display text-sm uppercase tracking-widest text-gold-300">
          Opening the Kingdom Hall…
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Cinematic banner */}
      <section className="relative isolate overflow-hidden border-b border-gold-sovereign/20">
        <img
          src="/images/hero-gates.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_30%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas-base/60 via-canvas-base/80 to-canvas-base" />
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:pb-12 sm:pt-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gold-400">
            The Kingdom Hall
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-wider text-parchment-50 sm:text-5xl">
            Welcome, {me.citizen?.characterName ?? me.user.username}
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className={buttonStyles({ variant: "secondary" })}>
              Return to Realm
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-12">
        {/* Citizen Pass */}
        <section aria-labelledby="pass-title" className="min-w-0 lg:col-span-7">
          <div className="parchment-sheet relative p-5 sm:p-8">
            <div className="flex items-start justify-between gap-3 border-b border-[#c2b28c] pb-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#633f19]">
                  {me.user.role}
                </p>
                <h2 id="pass-title" className="mt-1 font-display text-xl text-[#1f1d1a] sm:text-2xl">
                  Citizen Pass
                </h2>
                <p className="text-xs text-[#5c4300]">Kingdom of Dragonhold · Aetherial</p>
              </div>
              <div
                aria-hidden
                className="wax-seal flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-parchment-50"
              >
                <span className="font-display text-base font-bold">DH</span>
              </div>
            </div>

            <dl className="mt-1 text-sm">
              <PassRow label="Citizen ID">
                <span className="inline-block border border-[#8c6239]/60 bg-[#e6d7b5] px-3 py-1 font-mono text-base font-bold text-[#402d00]">
                  {me.citizen?.citizenCode ?? "—"}
                </span>
              </PassRow>
              <PassRow label="Character">
                <span className="font-serif text-base font-bold">
                  {me.citizen?.characterName ?? me.user.username}
                </span>
              </PassRow>
              <PassRow label="Username">
                <span className="font-mono text-sm">{me.user.username}</span>
              </PassRow>
              {me.user.email ? (
                <PassRow label="Email">
                  <span className="break-all font-mono text-sm [overflow-wrap:anywhere] sm:break-words">{me.user.email}</span>
                </PassRow>
              ) : null}
            </dl>
          </div>
        </section>

        {/* Realm state + chapter */}
        <aside className="min-w-0 space-y-8 lg:col-span-5">
          <section aria-labelledby="realm-title" className="relative border border-gold-sovereign/30 bg-canvas-surface p-5">
            <span aria-hidden className="pointer-events-none absolute -left-1 -top-1 h-2.5 w-2.5 border-l-2 border-t-2 border-gold-sovereign" />
            <span aria-hidden className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-sovereign" />
            <h2 id="realm-title" className="font-display text-sm uppercase tracking-widest text-gold-300">
              State of the Realm
            </h2>
            <dl className="mt-3 divide-y divide-canvas-border text-sm">
              {[
                ["Kingdom", "NEWLY ESTABLISHED", "text-emerald-400"],
                ["High Throne", "VACANT", "text-amber-400"],
                ["Chronicles", "BLANK", "text-gold-300"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-stone-400">{k}</dt>
                  <dd className={cx("text-right font-mono text-xs font-bold", c)}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="chapter-title" className="relative overflow-hidden border border-canvas-border">
            <img src="/images/episode-001.jpg" alt="" aria-hidden className="h-32 w-full object-cover" />
            <div className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold-400">Current chapter</p>
              <h2 id="chapter-title" className="mt-1 font-display text-lg text-parchment-50">Episode 001</h2>
              <p className="mt-2 font-serif text-sm leading-relaxed text-stone-400">
                Humanity is rebuilding after the war against the dragons.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {/* Proclamations */}
      <section aria-labelledby="proc-title" className="mx-auto max-w-4xl px-4 pb-14">
        <h2 id="proc-title" className="border-b border-gold-sovereign/30 pb-3 font-display text-lg uppercase tracking-widest text-gold-300">
          Proclamations
        </h2>
        {announcements === null ? (
          <p className="mt-6 font-serif text-sm text-stone-500">Reading the notice board…</p>
        ) : announcements.length === 0 ? (
          <div className="mt-6 flex items-start gap-4 border border-dashed border-gold-sovereign/30 p-5">
            <Emblem className="h-8 w-8 shrink-0 opacity-60" />
            <div>
              <p className="font-display text-sm text-gold-300">No proclamations yet.</p>
              <p className="mt-1 font-serif text-sm text-stone-400">
                When the Creator or the crown speaks, it will be written here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-canvas-border">
            {announcements.map((item) => (
              <li key={item.id} className="py-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-gold-400">
                  <span>{item.category.replace(/_/g, " ")}</span>
                  {item.publishedAt ? (
                    <time className="text-stone-500" dateTime={item.publishedAt}>
                      {new Date(item.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  ) : null}
                </div>
                <h3 className="mt-1 font-display text-lg text-parchment-50">{item.title}</h3>
                <p className="mt-2 whitespace-pre-line break-words font-serif text-sm leading-relaxed text-stone-300">
                  {item.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
