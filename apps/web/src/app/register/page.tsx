import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Become a Citizen" };

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Enlistment · Closed Beta"
      title="Become a Citizen"
      intro="Take your place in Dragonhold. A Citizen ID will be sealed upon your record."
    >
      <RegisterForm />
    </AuthShell>
  );
}
