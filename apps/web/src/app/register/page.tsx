import type { Metadata } from "next";
import { RegisterView } from "@/components/auth/auth-views";

export const metadata: Metadata = { title: "Become a Citizen" };

export default function RegisterPage() {
  return <RegisterView />;
}
