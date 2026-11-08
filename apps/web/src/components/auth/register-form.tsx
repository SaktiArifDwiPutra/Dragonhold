"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { registerSchema } from "@dragonhold/shared";
import { ApiError, api, errorText, type MeResponse } from "@/lib/api";
import { firstErrors } from "@/lib/forms";
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

export function RegisterForm() {
  const router = useRouter();
  const { signIn } = useAuth();
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

  const update = (key: keyof Values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(firstErrors<keyof Values>(parsed.error.flatten().fieldErrors));
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const me = await api<MeResponse>("/auth/register", {
        method: "POST",
        json: values,
      });
      signIn(me);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(
          firstErrors<keyof Values>(
            err.details as Partial<Record<keyof Values, string[]>>,
          ),
        );
      }
      setFormError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <Alert>{formError}</Alert> : null}
      <Field
        label="Citizen Name (Username)"
        name="username"
        autoComplete="username"
        placeholder="e.g. Aedan_Vance"
        value={values.username}
        onChange={update("username")}
        error={errors.username}
        hint="Letters, numbers, and underscores. It becomes your character name and record key."
      />
      <Field
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="aedan@dragonhold.realm"
        value={values.email}
        onChange={update("email")}
        error={errors.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 10 characters"
        value={values.password}
        onChange={update("password")}
        error={errors.password}
        hint="At least 10 characters."
      />
      <Field
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={values.confirmPassword}
        onChange={update("confirmPassword")}
        error={errors.confirmPassword}
      />
      <div className="relative border border-gold-sovereign/40 bg-canvas-base/80 p-3">
        <Field
          label="Closed Beta Access Code"
          name="betaCode"
          autoComplete="off"
          placeholder="DH-XXXX-XXXX"
          value={values.betaCode}
          onChange={update("betaCode")}
          error={errors.betaCode}
          hint="Required during Closed Beta. A permanent Citizen ID will be sealed upon entry."
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Sealing Record…" : "Take the Oath & Register"}
      </Button>
      <p className="text-center text-sm text-stone-400">
        Already enlisted in the realm?{" "}
        <Link
          href="/login"
          className="text-gold-300 underline underline-offset-4 hover:text-gold-400"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
