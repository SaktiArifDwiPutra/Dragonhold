"use client";

import { Suspense } from "react";
import { useLanguage } from "@/lib/i18n";
import { AuthShell } from "./auth-shell";
import { LoginForm } from "./login-form";
import { OnboardingForm } from "./onboarding-form";
import { RegisterForm } from "./register-form";

export function LoginView() {
  const { t } = useLanguage();
  return (
    <AuthShell
      eyebrow={t.auth.login.eyebrow}
      title={t.auth.login.title}
      intro={t.auth.login.intro}
    >
      <Suspense fallback={<p className="text-center text-sm text-stone-400">{t.common.loading}</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

export function RegisterView() {
  const { t } = useLanguage();
  return (
    <AuthShell
      eyebrow={t.auth.register.eyebrowOpen}
      title={t.auth.register.title}
      intro={t.auth.register.intro}
    >
      <Suspense fallback={<p className="text-center text-sm text-stone-400">{t.common.loading}</p>}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}

export function OnboardingView() {
  const { t } = useLanguage();
  return (
    <AuthShell
      eyebrow={t.auth.onboarding.eyebrow}
      title={t.auth.onboarding.title}
      intro={t.auth.onboarding.intro}
    >
      <OnboardingForm />
    </AuthShell>
  );
}
