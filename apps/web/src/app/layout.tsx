import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lora } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dragonhold — A Kingdom Yet to Be Written",
    template: "%s · Dragonhold",
  },
  description:
    "Dragonhold is a community-driven political fantasy kingdom in the world of Aetherial. Become a citizen and help write its history.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-body">
        <AuthProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
