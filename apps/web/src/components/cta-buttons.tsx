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
          href="/register"
          className={cx(buttonStyles({ size: "lg" }), "w-full sm:w-auto text-center")}
        >
          Become a Citizen
        </Link>
      )}
      {showDiscover ? (
        <Link
          href="#world"
          className={cx(
            buttonStyles({ variant: "secondary", size: "lg" }),
            "w-full sm:w-auto text-center",
          )}
        >
          Discover the Kingdom
        </Link>
      ) : null}
    </div>
  );
}