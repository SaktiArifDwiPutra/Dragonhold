"use client";

import Link from "next/link";
import { cx } from "@/lib/cx";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "./auth/auth-provider";
import { buttonStyles } from "./ui/button";

export function CtaButtons({ showDiscover = false }: { showDiscover?: boolean }) {
  const { status } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
      {status === "authenticated" ? (
        <Link
          href="/dashboard"
          className={cx(buttonStyles({ size: "lg" }), "w-full sm:w-auto text-center")}
        >
          {t.home.openYourRecord}
        </Link>
      ) : (
        <>
          <Link
            href="/register"
            className={cx(buttonStyles({ size: "lg" }), "w-full sm:w-auto text-center")}
          >
            {t.common.enterKingdom}
          </Link>
          <Link
            href="/login"
            className={cx(
              buttonStyles({ variant: "secondary", size: "lg" }),
              "w-full sm:w-auto text-center border-gold-sovereign/60 bg-canvas-base text-gold-300 hover:bg-canvas-surface",
            )}
          >
            {t.common.signIn}
          </Link>
        </>
      )}
      {showDiscover ? (
        <Link
          href="#chapter"
          className={cx(
            buttonStyles({ variant: "secondary", size: "lg" }),
            "w-full sm:w-auto text-center",
          )}
        >
          {t.common.exploreWorld}
        </Link>
      ) : null}
    </div>
  );
}
