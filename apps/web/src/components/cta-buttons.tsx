"use client";

import Link from "next/link";
import { useAuth } from "./auth/auth-provider";
import { buttonStyles } from "./ui/button";
import { cx } from "@/lib/cx";

export function CtaButtons({ showDiscover = false }: { showDiscover?: boolean }) {
  const { status } = useAuth();

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
      {status === "authenticated" ? (
        <Link
          href="/dashboard"
          className={cx(buttonStyles({ size: "lg" }), "w-full sm:w-auto text-center")}
        >
          Open Your Record
        </Link>
      ) : (
        <Link
          href="/login"
          className={cx(buttonStyles({ variant: "secondary", size: "lg" }), "w-full sm:w-auto text-center")}
        >
          Sign in
        </Link>
      )}
      {showDiscover ? (
        <Link
          href="#chapter"
          className={cx(
            buttonStyles({ variant: "secondary", size: "lg" }),
            "w-full sm:w-auto text-center",
          )}
        >
          Explore the World
        </Link>
      ) : null}
    </div>
  );
}
