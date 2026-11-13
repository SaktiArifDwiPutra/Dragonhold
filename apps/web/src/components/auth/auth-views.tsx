"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { AuthShell } from "./auth-shell";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export function LoginView() {
  const { t } = useLanguage();
  return (
    <AuthShell
      eyebrow={t.auth.login.eyebrow}
      title={t.auth.login.title}
      intro={t.auth.login.intro}
    >
      <LoginForm />
    </AuthShell>
  );
}

export function RegisterView() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"open" | "closed_beta">("open");
  return (
    <AuthShell
      eyebrow={mode === "closed_beta" ? t.auth.register.eyebrowBeta : t.auth.register.eyebrowOpen}
      title={t.auth.register.title}
      intro={t.auth.register.intro}
    >
      <RegisterForm onModeDetected={setMode} />
    </AuthShell>
  );
}

