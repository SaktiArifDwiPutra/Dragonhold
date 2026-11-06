"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Panel } from "@/components/ui/panel";

export default function DashboardPage() {
  const { status, me } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated" || !me) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-stone-300">
        Loading your record…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl">Citizen Record</h1>
      <Panel variant="parchment" className="mt-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
            <dt>Character name</dt>
            <dd className="font-semibold">{me.citizen?.characterName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
            <dt>Citizen ID</dt>
            <dd className="font-semibold">{me.citizen?.citizenCode ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Username</dt>
            <dd className="font-semibold">{me.user.username}</dd>
          </div>
        </dl>
      </Panel>
      <p className="mt-6 text-sm text-stone-400">
        The full citizen dashboard arrives in the next phase.
      </p>
    </div>
  );
}