"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { loginSchema } from "@dragonhold/shared";
import { api, errorText } from "@/lib/api";
import { firstErrors } from "@/lib/forms";
import { useLanguage } from "@/lib/i18n";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { useAuth } from "./auth-provider";

type Values = { email: string; password: string };
type FieldErrors = Partial<Record<keyof Values, string>>;

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { lang, t } = useLanguage();
  const [values, setValues] = useState<Values>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(translateErrors(firstErrors<keyof Values>(parsed.error.flatten().fieldErrors)));
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const me = await api<{
        user: { id: string; username: string; role: string; email?: string };
        citizen: {
          id: string;
          citizenCode: string | null;
          characterName: string | null;
          status?: string | null;
        } | null;
      }>("/auth/login", {
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
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <Alert>{formError}</Alert> : null}
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
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t.auth.login.submitting : t.auth.login.submit}
      </Button>
      <p className="text-center text-sm text-stone-400">
        {t.auth.login.noAccount}{" "}
        <Link
          href="/register"
          className="text-gold-300 underline underline-offset-4 hover:text-gold-400"
        >
          {t.auth.login.becomeCitizen}
        </Link>
      </p>
    </form>
  );
}
