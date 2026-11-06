import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Become a Citizen" };

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <Panel>
        <h1 className="text-2xl">Become a Citizen</h1>
        <p className="mt-2 text-sm text-stone-300">
          Take your place in Dragonhold. We only ask for what we need.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </Panel>
    </div>
  );
}