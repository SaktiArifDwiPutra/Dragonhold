"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { Alert } from "../ui/alert";
import { GoogleOAuthButton } from "./google-oauth-button";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const oauthErrorCode = searchParams.get("error");
  const oauthErrorMessage = oauthErrorCode
    ? t.apiErrors[oauthErrorCode] ?? t.apiErrors.UNKNOWN
    : null;

  return (
    <div className="space-y-6">
      {oauthErrorMessage ? <Alert>{oauthErrorMessage}</Alert> : null}

      <div className="space-y-2 border border-canvas-border bg-canvas-base/70 p-4 text-xs leading-relaxed text-stone-300">
        <p>{t.auth.register.stepOne}</p>
        <p>{t.auth.register.stepTwo}</p>
        <p>{t.auth.register.stepThree}</p>
      </div>

      <GoogleOAuthButton
        intent="register"
        label={t.auth.register.continueWithGoogle}
        loadingLabel={t.auth.register.redirectingGoogle}
        className="w-full"
      />

      <p className="text-center text-sm text-stone-400">
        {t.auth.register.hasAccount}{" "}
        <Link
          href="/login"
          className="text-gold-300 underline underline-offset-4 hover:text-gold-400"
        >
          {t.auth.register.signIn}
        </Link>
      </p>
    </div>
  );
}
