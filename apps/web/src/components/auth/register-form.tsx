"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { registerSchema } from "@dragonhold/shared";
import { ApiError, api, errorText, type MeResponse } from "@/lib/api";
import { firstErrors } from "@/lib/forms";
import { useLanguage } from "@/lib/i18n";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { useAuth } from "./auth-provider";

type Values = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  betaCode: string;
};
type FieldErrors = Partial<Record<keyof Values, string>>;

export function RegisterForm({
  onModeDetected,
}: {
  onModeDetected?: (mode: "open" | "closed_beta") => void;
}) {
  const router = useRouter();
  const { signIn } = useAuth();
  const { lang, t } = useLanguage();
  const [registrationMode, setRegistrationMode] = useState<"open" | "closed_beta">("open");
  const [values, setValues] = useState<Values>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    betaCode: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ mode: "open" | "closed_beta" }>("/auth/registration-config")
      .then((res) => {
        if (!active) return;
        const mode = res.mode === "closed_beta" ? "closed_beta" : "open";
        setRegistrationMode(mode);
        onModeDetected?.(mode);
      })
      .catch(() => {
        // Default to open mode if config fetch fails
      });
    return () => {
      active = false;
    };
  }, [onModeDetected]);

  const update = (key: keyof Values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function translateErrors(raw: FieldErrors): FieldErrors {
    const out: FieldErrors = {};
    for (const [k, msg] of Object.entries(raw) as Array<[keyof Values, string | undefined]>) {
      if (msg) out[k] = t.auth.validation[msg] ?? msg;
    }
    return out;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const payload =
      registrationMode === "closed_beta"
        ? values
        : {
            username: values.username,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
          };

    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(translateErrors(firstErrors<keyof Values>(parsed.error.flatten().fieldErrors)));
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const me = await api<MeResponse>("/auth/register", {
        method: "POST",
        json: payload,
      });
      signIn(me);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(
          translateErrors(
            firstErrors<keyof Values>(
              err.details as Partial<Record<keyof Values, string[]>>,
            ),
          ),
        );
      }
      setFormError(errorText(err, lang));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <Alert>{formError}</Alert> : null}
      <Field
        label={t.auth.register.usernameLabel}
        name="username"
        autoComplete="username"
        placeholder={t.auth.register.usernamePlaceholder}
        value={values.username}
        onChange={update("username")}
        error={errors.username}
        hint={t.auth.register.usernameHint}
      />
      <Field
        label={t.auth.register.emailLabel}
        name="email"
        type="email"
        autoComplete="email"
        placeholder={t.auth.register.emailPlaceholder}
        value={values.email}
        onChange={update("email")}
        error={errors.email}
      />
      <Field
        label={t.auth.register.passwordLabel}
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder={t.auth.register.passwordPlaceholder}
        value={values.password}
        onChange={update("password")}
        error={errors.password}
        hint={t.auth.register.passwordHint}
      />
      <Field
        label={t.auth.register.confirmLabel}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder={t.auth.register.confirmPlaceholder}
        value={values.confirmPassword}
        onChange={update("confirmPassword")}
        error={errors.confirmPassword}
      />
      {registrationMode === "closed_beta" ? (
        <div className="relative border border-gold-sovereign/40 bg-canvas-base/80 p-3">
          <Field
            label={t.auth.register.betaLabel}
            name="betaCode"
            autoComplete="off"
            placeholder={t.auth.register.betaPlaceholder}
            value={values.betaCode}
            onChange={update("betaCode")}
            error={errors.betaCode}
            hint={t.auth.register.betaHint}
          />
        </div>
      ) : null}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t.auth.register.submitting : t.auth.register.submit}
      </Button>
      <p className="text-center text-sm text-stone-400">
        {t.auth.register.hasAccount}{" "}
        <Link
          href="/login"
          className="text-gold-300 underline underline-offset-4 hover:text-gold-400"
        >
          {t.auth.register.signIn}
        </Link>
      </p>
    </form>
  );
}
