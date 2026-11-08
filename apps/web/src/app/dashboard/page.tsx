"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function DashboardPage() {
  const { status, me, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (status !== "authenticated" || !me) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-stone-400">
        Accessing citizen record…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      {/* Top Header with Citizen Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gold-400">
            Citizen Cartulary
          </p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-parchment-50">
            Citizen Record
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className={buttonStyles({ variant: "secondary" })}>
            Return to Realm
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>

      {/* The Citizen Pass: Tactile Vellum Parchment Document with Wax Seal */}
      <div className="parchment-sheet relative mt-8 p-6 sm:p-8 transition-all duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-[#c2b28c] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded border border-[#8c6239]/50 bg-[#e6d7b5] px-2.5 py-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#633f19]">
                🛡️ {me.user.role}
              </span>
            </div>
            <h2 className="mt-2 font-serif text-xl sm:text-2xl font-bold text-[#1f1d1a]">
              Aetherial Citizen Pass
            </h2>
            <p className="font-sans text-xs text-[#5c4300]">
              Official Registry of the High Realm of Dragonhold
            </p>
          </div>

          {/* Crimson Wax Seal Signet */}
          <div
            aria-label="Sovereign Wax Seal"
            className="wax-seal flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-parchment-50 shadow-md"
          >
            <span className="font-serif text-base font-bold">DH</span>
          </div>
        </div>

        <dl className="mt-5 space-y-4 text-sm">
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
            <dt className="font-sans text-stone-700">Username</dt>
            <dd className="font-mono text-sm font-semibold text-[#1f1d1a]">
              {me.user.username}
            </dd>
          </div>
          {me.user.email ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="font-sans text-stone-700">Email Address</dt>
              <dd className="font-sans text-sm text-[#2c2825]">{me.user.email}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 pt-3 border-t border-[#d4c49e] flex items-center justify-between text-xs text-[#5c4300] font-medium">
          <span>Sealed in Chancery Vault B</span>
          <span className="font-mono uppercase text-[10px]">Imperial Registry Intact</span>
        </div>
      </div>

      {/* Realm Status & Chronicles Context */}
      <div className="mt-10">
        <h2 className="font-serif text-xl font-bold uppercase tracking-wider text-gold-400">
          Realm Overview
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Panel variant="dark" brackets>
            <h3 className="font-serif text-base font-semibold text-gold-300">
              Kingdom of Dragonhold
            </h3>
            <p className="mt-2 text-sm text-stone-300">
              Status: <span className="font-semibold text-emerald-400">NEWLY ESTABLISHED</span>
            </p>
            <p className="mt-1 text-xs text-stone-400">
              The High Throne remains vacant. Humanity is rebuilding in the aftermath of the dragon war.
            </p>
          </Panel>
          <Panel variant="dark" brackets>
            <h3 className="font-serif text-base font-semibold text-gold-300">
              Chronicles of the Realm
            </h3>
            <p className="mt-2 text-sm text-stone-300">
              Status: <span className="font-semibold text-amber-300">BLANK</span>
            </p>
            <p className="mt-1 text-xs text-stone-400">
              The first chapter begins with Episode 001. Governance, decrees, and citizen participation will activate as the realm unfolds.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
