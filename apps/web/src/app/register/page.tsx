import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Become a Citizen" };

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <Panel variant="dark" brackets>
        <p className="font-mono text-xs uppercase tracking-widest text-gold-400">
          Enlistment · Closed Beta
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl tracking-wide text-parchment-50">
          Become a Citizen
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          Take your place in Dragonhold. A Citizen ID will be sealed upon your record.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </Panel>
    </div>
  );
}
