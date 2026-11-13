import type { Metadata } from "next";
import { OnboardingView } from "@/components/auth/auth-views";

export const metadata: Metadata = { title: "Complete Registration" };

export default function OnboardingPage() {
  return <OnboardingView />;
}

