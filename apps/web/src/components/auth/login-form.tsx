"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { loginSchema } from "@dragonhold/shared";
import { api, errorText, type MeResponse } from "@/lib/api";
import { firstErrors } from "@/lib/forms";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { useAuth } from "./auth-provider";

type Values = { email: string; password: string };
type FieldErrors = Partial<Record<keyof Values, string>>;

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [values, setValues] = useState<Values>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof Values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(firstErrors<keyof Values>(parsed.error.flatten().fieldErrors));
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
      setFormError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <Alert>{formError}</Alert> : null}
      <Field
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="citizen@dragonhold.realm"
        value={values.email}
        onChange={update("email")}
        error={errors.email}
      />
      <Field
        label="Secret Key (Password)"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••••••"
        value={values.password}
        onChange={update("password")}
        error={errors.password}
      />
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Verifying Credentials…" : "Enter the Realm"}
      </Button>
      <p className="text-center text-sm text-stone-400">
        Not a citizen yet?{" "}
        <Link
          href="/register"
          className="text-gold-300 underline underline-offset-4 hover:text-gold-400"
        >
          Become a Citizen
        </Link>
      </p>
    </form>
  );
}
