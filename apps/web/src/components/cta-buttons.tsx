"use client";

import Link from "next/link";
import { useAuth } from "./auth/auth-provider";
import { buttonStyles } from "./ui/button";

export function CtaButtons({ showDiscover = false }: { showDiscover?: boolean }) {
  const { status } = useAuth();

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      {status === "authenticated" ? (
        <Link href="/dashboard" className={buttonStyles({ size: "lg" })}>
          Open Your Record
        </Link>
      ) : (
        <Link href="/register" className={buttonStyles({ size: "lg" })}>
          Become a Citizen
        </Link>
      )}
      {showDiscover ? (
        <Link href="#world" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          Discover the Kingdom
        </Link>
      ) : null}
    </div>
  );
}