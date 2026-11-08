import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-14 pb-20 sm:pb-14">
      <Panel brackets variant="hud">
        <p className="font-display text-[10px] uppercase tracking-widest text-gold-400">
          Citizen Verification
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-display tracking-wide text-parchment-50">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-stone-300">Return to your citizen record and realm chronicles.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Panel>
    </div>
  );
}