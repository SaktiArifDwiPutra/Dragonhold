"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  googleOnboardingSchema,
  linkExistingAccountSchema,
  usernameSchema,
} from "@dragonhold/shared";
import { ApiError, api, errorText, type MeResponse } from "@/lib/api";
import { firstErrors } from "@/lib/forms";
import { useLanguage } from "@/lib/i18n";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { useAuth } from "./auth-provider";
import { AvatarUploadField } from "./avatar-upload-field";
import { GoogleOAuthButton } from "./google-oauth-button";

type OnboardingSessionInfo = {
  email: string;
  suggestedUsername: string;
  suggestedDisplayName: string;
  suggestedAvatarUrl: string;
  hasUnlinkedEmailAccount: boolean;
  expiresAt: string;
};

type OnboardingValues = {
  username: string;
  displayName: string;
  avatarUrl: string;
};

type LinkValues = {
  email: string;
  password: string;
};

type AvailabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "taken" }
  | { status: "invalid" };

export function OnboardingForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { lang, t } = useLanguage();

  const [sessionState, setSessionState] = useState<
    | { status: "loading" }
    | { status: "expired" }
    | { status: "ready"; data: OnboardingSessionInfo }
  >({ status: "loading" });

  const [values, setValues] = useState<OnboardingValues>({
    username: "",
    displayName: "",
    avatarUrl: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingValues, string>>>({});
  const [availability, setAvailability] = useState<AvailabilityState>({ status: "idle" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showLinkExisting, setShowLinkExisting] = useState(false);
  const [linkValues, setLinkValues] = useState<LinkValues>({ email: "", password: "" });
  const [linkErrors, setLinkErrors] = useState<Partial<Record<keyof LinkValues, string>>>({});
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api<OnboardingSessionInfo>("/auth/google/onboarding")
      .then((data) => {
        if (!active) return;
        setSessionState({ status: "ready", data });
        setValues({
          username: data.suggestedUsername,
          displayName: data.suggestedDisplayName,
          avatarUrl: data.suggestedAvatarUrl,
        });
        setLinkValues((v) => ({ ...v, email: data.email }));
        if (data.hasUnlinkedEmailAccount) {
          setShowLinkExisting(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setSessionState({ status: "expired" });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (sessionState.status !== "ready") return;
    const raw = values.username.trim();
    if (!raw) {
      setAvailability({ status: "idle" });
      return;
    }

    const parsed = usernameSchema.safeParse(raw);
    if (!parsed.success) {
      setAvailability({ status: "invalid" });
      return;
    }

    let active = true;
    setAvailability({ status: "checking" });
    const timer = setTimeout(() => {
      api<{ available: boolean; reason?: string }>(
        `/auth/username-available?username=${encodeURIComponent(parsed.data)}`,
      )
        .then((res) => {
          if (!active) return;
          setAvailability(res.available ? { status: "available" } : { status: "taken" });
        })
        .catch(() => {
          if (!active) return;
          setAvailability({ status: "idle" });
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [values.username, sessionState.status]);

  function translateErrors<T extends string>(
    raw: Partial<Record<T, string>>,
  ): Partial<Record<T, string>> {
    const out: Partial<Record<T, string>> = {};
    for (const [k, msg] of Object.entries(raw) as Array<[T, string | undefined]>) {
      if (msg) out[k] = t.auth.validation[msg] ?? msg;
    }
    return out;
  }

  const updateField =
    (key: keyof OnboardingValues) => (e: ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmitOnboarding(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = googleOnboardingSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(
        translateErrors(
          firstErrors<keyof OnboardingValues>(parsed.error.flatten().fieldErrors),
        ),
      );
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const me = await api<MeResponse>("/auth/google/onboarding", {
        method: "POST",
        json: values,
      });
      signIn(me);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ONBOARDING_EXPIRED") {
          setSessionState({ status: "expired" });
          return;
        }
        if (err.code === "USERNAME_TAKEN") {
          setErrors({ username: errorText(err, lang) });
        }
        if (err.details) {
          setErrors(
            translateErrors(
              firstErrors<keyof OnboardingValues>(
                err.details as Partial<Record<keyof OnboardingValues, string[]>>,
              ),
            ),
          );
        }
      }
      setFormError(errorText(err, lang));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitLinkExisting(e: FormEvent) {
    e.preventDefault();
    if (linkSubmitting) return;
    setFormError(null);

    const parsed = linkExistingAccountSchema.safeParse(linkValues);
    if (!parsed.success) {
      setLinkErrors(
        translateErrors(
          firstErrors<keyof LinkValues>(parsed.error.flatten().fieldErrors),
        ),
      );
      return;
    }
    setLinkErrors({});

    setLinkSubmitting(true);
    try {
      const me = await api<MeResponse>("/auth/google/link-existing", {
        method: "POST",
        json: linkValues,
      });
      signIn(me);
      router.push("/dashboard?linked=1");
    } catch (err) {
      if (err instanceof ApiError && err.code === "ONBOARDING_EXPIRED") {
        setSessionState({ status: "expired" });
        return;
      }
      setFormError(errorText(err, lang));
    } finally {
      setLinkSubmitting(false);
    }
  }

  if (sessionState.status === "loading") {
    return (
      <p className="py-6 text-center text-sm text-stone-400">
        {t.auth.onboarding.loading}
      </p>
    );
  }

  if (sessionState.status === "expired") {
    return (
      <div className="space-y-5">
        <Alert>{t.auth.onboarding.expiredBody}</Alert>
        <GoogleOAuthButton
          intent="register"
          label={t.auth.onboarding.restartGoogle}
          loadingLabel={t.auth.register.redirectingGoogle}
          className="w-full"
        />
      </div>
    );
  }

  const avatarPreviewValid =
    /^https?:\/\/[^\s]+$/i.test(values.avatarUrl.trim()) ||
    /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,/i.test(values.avatarUrl.trim());

  return (
    <div className="space-y-6">
      {formError ? <Alert>{formError}</Alert> : null}

      <div className="flex items-center justify-between gap-3 border border-gold-sovereign/30 bg-canvas-base/80 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-gold-400">
            {t.auth.onboarding.verifiedGoogleLabel}
          </p>
          <p className="truncate font-mono text-xs text-parchment-50">
            {sessionState.data.email}
          </p>
        </div>
        {avatarPreviewValid ? (
          <img
            src={values.avatarUrl.trim()}
            alt={t.auth.onboarding.avatarPreviewAlt}
            className="h-10 w-10 shrink-0 border border-gold-sovereign/50 object-cover"
          />
        ) : null}
      </div>

      {sessionState.data.hasUnlinkedEmailAccount ? (
        <div className="border border-amber-500/40 bg-amber-950/20 p-3.5 text-xs leading-relaxed text-amber-200">
          <p className="font-semibold text-amber-100">
            {t.auth.onboarding.unlinkedNoticeTitle}
          </p>
          <p className="mt-1">{t.auth.onboarding.unlinkedNoticeBody}</p>
        </div>
      ) : null}

      {!showLinkExisting ? (
        <form onSubmit={onSubmitOnboarding} noValidate className="space-y-4">
          <div>
            <Field
              label={t.auth.onboarding.usernameLabel}
              name="username"
              autoComplete="username"
              placeholder={t.auth.onboarding.usernamePlaceholder}
              value={values.username}
              onChange={updateField("username")}
              error={errors.username}
              hint={t.auth.onboarding.usernameHint}
            />
            {availability.status !== "idle" && !errors.username ? (
              <p
                className={
                  availability.status === "available"
                    ? "mt-1.5 font-mono text-[11px] text-emerald-400"
                    : availability.status === "checking"
                      ? "mt-1.5 font-mono text-[11px] text-stone-400"
                      : "mt-1.5 font-mono text-[11px] text-amber-400"
                }
              >
                {availability.status === "checking"
                  ? t.auth.onboarding.checkingUsername
                  : availability.status === "available"
                    ? t.auth.onboarding.usernameAvailable
                    : availability.status === "taken"
                      ? t.auth.onboarding.usernameTaken
                      : t.auth.onboarding.usernameInvalid}
              </p>
            ) : null}
          </div>

          <Field
            label={t.auth.onboarding.displayNameLabel}
            name="displayName"
            placeholder={t.auth.onboarding.displayNamePlaceholder}
            value={values.displayName}
            onChange={updateField("displayName")}
            error={errors.displayName}
          />

          <AvatarUploadField
            value={values.avatarUrl}
            googleDefaultUrl={sessionState.data.suggestedAvatarUrl}
            onChange={(nextUrl) =>
              setValues((v) => ({ ...v, avatarUrl: nextUrl }))
            }
            error={errors.avatarUrl}
          />

          <Button
            type="submit"
            disabled={
              submitting ||
              availability.status === "taken" ||
              availability.status === "invalid"
            }
            className="w-full"
          >
            {submitting ? t.auth.onboarding.submitting : t.auth.onboarding.submit}
          </Button>
        </form>
      ) : (
        <form onSubmit={onSubmitLinkExisting} noValidate className="space-y-4">
          <Field
            label={t.auth.login.emailLabel}
            name="linkEmail"
            type="email"
            autoComplete="email"
            value={linkValues.email}
            onChange={(e) =>
              setLinkValues((v) => ({ ...v, email: e.target.value }))
            }
            error={linkErrors.email}
          />
          <Field
            label={t.auth.login.passwordLabel}
            name="linkPassword"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={linkValues.password}
            onChange={(e) =>
              setLinkValues((v) => ({ ...v, password: e.target.value }))
            }
            error={linkErrors.password}
          />
          <Button type="submit" disabled={linkSubmitting} className="w-full">
            {linkSubmitting
              ? t.auth.onboarding.linkExistingSubmitting
              : t.auth.onboarding.linkExistingSubmit}
          </Button>
        </form>
      )}

      <div className="border-t border-canvas-border pt-3">
        <button
          type="button"
          onClick={() => {
            setShowLinkExisting((v) => !v);
            setFormError(null);
          }}
          className="w-full text-center font-mono text-[11px] uppercase tracking-wider text-stone-400 underline underline-offset-4 hover:text-gold-300"
        >
          {showLinkExisting
            ? t.auth.onboarding.linkExistingToggleHide
            : t.auth.onboarding.linkExistingToggleShow}
        </button>
      </div>
    </div>
  );
}

