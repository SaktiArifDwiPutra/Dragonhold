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
      <div className="mx-auto max-w-3xl px-4 py-16 text-stone-300">
        Loading your record…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-gold-400">
            Citizen Identity
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl">Citizen Record</h1>
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

      {/* Citizen Details */}
      <Panel variant="parchment" className="mt-6">
        <div className="border-b border-parchment-300 pb-3">
          <span className="inline-block rounded border border-gold-600 bg-gold-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-gold-800">
            {me.user.role}
          </span>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
            <dt className="text-stone-600">Character name</dt>
            <dd className="font-semibold text-stone-900">{me.citizen?.characterName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
            <dt className="text-stone-600">Citizen ID</dt>
            <dd className="font-mono font-semibold text-stone-900">{me.citizen?.citizenCode ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
            <dt className="text-stone-600">Username</dt>
            <dd className="font-semibold text-stone-900">{me.user.username}</dd>
          </div>
          {me.user.email ? (
            <div className="flex justify-between gap-4">
              <dt className="text-stone-600">Email</dt>
              <dd className="font-semibold text-stone-900">{me.user.email}</dd>
            </div>
          ) : null}
        </dl>
      </Panel>

      {/* Realm Status */}
      <div className="mt-8">
        <h2 className="text-xl">Realm Overview</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Panel>
            <h3 className="text-base font-semibold text-gold-300">Kingdom of Dragonhold</h3>
            <p className="mt-2 text-sm text-stone-300">
              Status: <span className="font-semibold text-parchment-100">Newly Established</span>
            </p>
            <p className="mt-1 text-xs text-stone-400">
              The throne remains vacant. Humanity is rebuilding in the aftermath of the dragon war.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-base font-semibold text-gold-300">Chronicles of the Realm</h3>
            <p className="mt-2 text-sm text-stone-300">
              Upcoming: <span className="font-semibold text-parchment-100">Episode 001</span>
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Governance, voting, and chronicle records will activate as the kingdom unfolds.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}