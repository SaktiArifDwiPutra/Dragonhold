"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./auth/auth-provider";
import { Emblem } from "./emblem";
import { Button, buttonStyles } from "./ui/button";
import { cx } from "@/lib/cx";

const NAV = [
  { href: "/#world", label: "World" },
  { href: "/#kingdom", label: "Kingdom" },
  { href: "/#government", label: "Government" },
  { href: "/#participate", label: "Community" },
  { href: "/#announcements", label: "Announcements" },
];

export function SiteHeader() {
  const { status, me, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-canvas-border bg-canvas-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Emblem className="h-8 w-8 transition-transform hover:scale-105" />
            <span className="font-display text-base tracking-widest text-parchment-50 sm:text-lg">
              DRAGONHOLD
            </span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded border border-gold-sovereign/30 bg-canvas-base px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-gold-300 lg:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-sovereign" />
            Era I · Post-Dragon War
          </span>
        </div>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-stone-300 transition-colors hover:text-gold-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User actions & mobile menu button */}
        <div className="flex min-h-12 items-center gap-2">
          {status === "authenticated" && me ? (
            <>
              <Link
                href="/dashboard"
                className="hidden max-w-40 truncate text-sm font-medium text-stone-300 transition-colors hover:text-gold-300 sm:inline"
              >
                {me.citizen?.characterName ?? me.user.username}
              </Link>
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="text-xs sm:text-sm"
              >
                Sign out
              </Button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link
                href="/login"
                className={cx(
                  buttonStyles({ variant: "ghost" }),
                  "px-3 text-xs sm:text-sm",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={cx(
                  buttonStyles(),
                  "px-3.5 text-xs sm:px-4 sm:text-sm",
                )}
              >
                Become Citizen
              </Link>
            </>
          ) : null}

          {/* Mobile hamburger button with strict 48px touch hitbox */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="flex h-12 w-12 items-center justify-center rounded border border-canvas-border text-stone-300 transition-colors hover:border-gold-sovereign hover:text-gold-300 md:hidden"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen ? (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-canvas-border bg-canvas-base/98 px-4 py-4 md:hidden shadow-2xl backdrop-blur-md"
        >
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[48px] items-center text-sm font-medium text-stone-200 hover:text-gold-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
