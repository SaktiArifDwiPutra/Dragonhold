"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
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

export default function DashboardPage() {
  const { status, me, logout } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      api<{ announcements: Announcement[] }>("/announcements")
        .then((res) => setAnnouncements(res.announcements ?? []))
        .catch(() => setAnnouncements([]));
    }
  }, [status]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (status !== "authenticated" || !me) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-stone-400 font-serif">
        Accessing the Kingdom Hall archives…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      {/* Kingdom Hall Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-canvas-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gold-400">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-sovereign animate-pulse" />
            <span>THE KINGDOM HALL · CITIZEN SANCTUM</span>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl text-parchment-50">
            Hall of Citizens
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className={buttonStyles({ variant: "secondary", size: "md" })}>
            Return to Realm
          </Link>
          <Button variant="ghost" size="md" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left Column: The Official Citizen Pass (Tactile Vellum Parchment) */}
        <div className="lg:col-span-7">
          <div className="parchment-sheet relative p-6 sm:p-8 transition-all duration-200 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#c2b28c] pb-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded border border-[#8c6239]/50 bg-[#e6d7b5] px-2.5 py-1">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#633f19]">
                    🛡️ {me.user.role}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#1f1d1a]">
                  Aetherial Citizen Pass
                </h2>
                <p className="font-sans text-xs text-[#5c4300]">
                  Sealed Registry of the High Realm of Dragonhold
                </p>
              </div>

              {/* Crimson Wax Seal Signet */}
              <div
                aria-label="Sovereign Wax Seal"
                className="wax-seal flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-parchment-50 shadow-md"
              >
                <span className="font-display text-base font-bold">DH</span>
              </div>
            </div>

            <dl className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#d4c49e] pb-3">
                <dt className="font-sans text-stone-700">Citizen ID</dt>
                <dd className="rounded border border-[#8c6239]/60 bg-[#e6d7b5] px-3 py-1 font-mono text-sm sm:text-base font-bold text-[#402d00] shadow-inner">
                  {me.citizen?.citizenCode ?? "DH-000001"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#d4c49e] pb-3">
                <dt className="font-sans text-stone-700">Character Name</dt>
                <dd className="font-serif text-base font-bold text-[#1f1d1a]">
                  {me.citizen?.characterName ?? me.user.username}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#d4c49e] pb-3">
                <dt className="font-sans text-stone-700">Registry Username</dt>
                <dd className="font-mono text-sm font-semibold text-[#1f1d1a]">
                  {me.user.username}
                </dd>
              </div>
              {me.user.email ? (
                <div className="flex items-center justify-between gap-4 border-b border-[#d4c49e] pb-3">
                  <dt className="font-sans text-stone-700">Chancery Dispatch</dt>
                  <dd className="font-sans text-sm text-[#2c2825]">{me.user.email}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 pt-3 border-t border-[#d4c49e] flex items-center justify-between text-xs text-[#5c4300] font-medium">
              <span>Sealed in Chancery Vault B</span>
              <span className="font-mono uppercase text-[10px]">Imperial Registry Intact</span>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Realm Status & Current Story Chapter */}
        <div className="lg:col-span-5 space-y-6">
          {/* Realm Status HUD Panel */}
          <div className="border border-canvas-border bg-canvas-surface p-5 shadow-lg relative">
            <span className="pointer-events-none absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -right-1 h-2 w-2 border-b-2 border-r-2 border-gold-sovereign" />
            <h3 className="font-display text-sm uppercase tracking-wider text-gold-300">
              Realm State Matrix
            </h3>
            <dl className="mt-3 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-canvas-border pb-2">
                <dt className="text-stone-400">Kingdom Status</dt>
                <dd className="font-mono font-bold text-emerald-400">NEWLY ESTABLISHED</dd>
              </div>
              <div className="flex justify-between border-b border-canvas-border pb-2">
                <dt className="text-stone-400">High Throne</dt>
                <dd className="font-mono font-bold text-amber-400">VACANT</dd>
              </div>
              <div className="flex justify-between border-b border-canvas-border pb-2">
                <dt className="text-stone-400">First Ruler</dt>
                <dd className="text-stone-300">Awaiting Citizen Election</dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-stone-400">Chronicle Chapter</dt>
                <dd className="font-mono text-gold-300">Episode 001</dd>
              </div>
            </dl>
          </div>

          {/* Current Story / Episode 001 Quick Access */}
          <div className="border border-canvas-border bg-canvas-surface p-5 shadow-lg">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-gold-400">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-sovereign" />
              <span>CURRENT CHAPTER</span>
            </div>
            <h4 className="mt-1 font-display text-base text-parchment-50">
              Episode 001: The Cessation of Dragonfire
            </h4>
            <p className="mt-2 text-xs text-stone-400 leading-relaxed font-serif">
              The war against dragons has concluded. Humanity gathers at the gates of Dragonhold to rebuild what was lost.
            </p>
            <div className="mt-4">
              <Link
                href="/#announcements"
                className={cx(buttonStyles({ variant: "secondary", size: "md" }), "w-full text-xs text-center")}
              >
                Inspect Royal Decrees
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Published Royal Proclamations */}
      {announcements.length > 0 ? (
        <div className="mt-12">
          <h2 className="font-display text-xl uppercase tracking-wider text-gold-400">
            Latest Royal Proclamations
          </h2>
          <div className="mt-4 space-y-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="border border-canvas-border bg-canvas-surface p-5 shadow-md transition-all hover:border-gold-sovereign/40"
              >
                <div className="flex items-center justify-between border-b border-canvas-border pb-2">
                  <span className="font-mono text-xs font-semibold text-gold-300 uppercase tracking-wider">
                    📜 {item.category.replace(/_/g, " ")}
                  </span>
                  {item.publishedAt ? (
                    <span className="text-xs font-mono text-stone-500">
                      {new Date(item.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-lg font-display text-parchment-50">{item.title}</h3>
                <p className="mt-2 text-sm text-stone-300 font-serif leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
