"use client";

import Link from "next/link";
import { Alert } from "../ui/alert";
import { buttonStyles } from "../ui/button";
import { cx } from "@/lib/cx";

export function RegisterForm() {
  return (
    <div className="space-y-5">
      <Alert variant="info">
        Public registration is currently disabled.
      </Alert>
      <Link href="/login" className={cx(buttonStyles(), "w-full")}>
        Sign in
      </Link>
    </div>
  );
}

