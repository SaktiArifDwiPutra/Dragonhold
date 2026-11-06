import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <Panel>
        <h1 className="text-2xl">Sign in</h1>
        <p className="mt-2 text-sm text-stone-300">Return to your royal record.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Panel>
    </div>
  );
}