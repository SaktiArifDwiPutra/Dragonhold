import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { cx } from "@/lib/cx";

export const metadata: Metadata = { title: "Registration Closed" };

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Citizen Registry"
      title="Registration Closed"
      intro="Public citizen registration is currently disabled."
    >
      <div className="space-y-5">
        <Alert variant="info">
          New account registration is closed. Existing citizens and administrators may sign in below.
        </Alert>
        <div className="flex flex-col gap-3">
          <Link href="/login" className={cx(buttonStyles(), "w-full")}>
            Sign in
          </Link>
          <Link
            href="/"
            className={cx(buttonStyles({ variant: "secondary" }), "w-full")}
          >
            Return to Realm
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

