"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { loginSchema } from "@dragonhold/shared";
import { api, errorText, type MeResponse } from "@/lib/api";
import { firstErrors } from "@/lib/forms";
import { useLanguage } from "@/lib/i18n";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { useAuth } from "./auth-provider";
import { GoogleOAuthButton } from "./google-oauth-button";

type Values = { email: string; password: string };
type FieldErrors = Partial<Record<keyof Values, string>>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const { lang, t } = useLanguage();
  const [showLegacyLogin, setShowLegacyLogin] = useState(false);
  const [values, setValues] = useState<Values>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const oauthErrorCode = searchParams.get("error");
  const oauthErrorMessage = oauthErrorCode
    ? t.apiErrors[oauthErrorCode] ?? t.apiErrors.UNKNOWN
    : null;

  const update = (key: keyof Values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function translateErrors(raw: FieldErrors): FieldErrors {
    const out: FieldErrors = {};
    for (const [k, msg] of Object.entries(raw) as Array<[keyof Values, string | undefined]>) {
      if (msg) out[k] = t.auth.validation[msg] ?? msg;
    }
    return out;
  }

  async function onSubmitLegacy(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(translateErrors(firstErrors<keyof Values>(parsed.error.flatten().fieldErrors)));
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const me = await api<MeResponse>("/auth/login", {
        method: "POST",
        json: values,
      });
      signIn(me);
      router.push("/dashboard");
    } catch (err) {
      setFormError(errorText(err, lang));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {oauthErrorMessage && !formError ? <Alert>{oauthErrorMessage}</Alert> : null}
      {formError ? <Alert>{formError}</Alert> : null}

      <GoogleOAuthButton
        intent="login"
        label={t.auth.login.continueWithGoogle}
        loadingLabel={t.auth.login.redirectingGoogle}
        className="w-full"
      />

      <p className="text-center text-sm text-stone-400">
        {t.auth.login.noAccount}{" "}
        <Link
          href="/register"
          className="text-gold-300 underline underline-offset-4 hover:text-gold-400"
        >
          {t.auth.login.becomeCitizen}
        </Link>
      </p>

      <div className="border-t border-canvas-border pt-4">
        <button
          type="button"
          onClick={() => {
            setShowLegacyLogin((v) => !v);
            setFormError(null);
          }}
          className="w-full text-center font-mono text-[11px] uppercase tracking-wider text-stone-400 underline underline-offset-4 hover:text-gold-300"
        >
          {showLegacyLogin
            ? t.auth.login.legacyToggleHide
            : t.auth.login.legacyToggleShow}
        </button>

        {showLegacyLogin ? (
          <form onSubmit={onSubmitLegacy} noValidate className="mt-4 space-y-4">
            <p className="border border-canvas-border bg-canvas-base/70 p-3 text-xs leading-relaxed text-stone-400">
              {t.auth.login.legacyNotice}
            </p>
            <Field
              label={t.auth.login.emailLabel}
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t.auth.login.emailPlaceholder}
              value={values.email}
              onChange={update("email")}
              error={errors.email}
            />
            <Field
              label={t.auth.login.passwordLabel}
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={values.password}
              onChange={update("password")}
              error={errors.password}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? t.auth.login.submitting : t.auth.login.submit}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
