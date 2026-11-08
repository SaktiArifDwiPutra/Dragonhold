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
    <header className="sticky top-0 z-20 border-b-2 border-navy-700 bg-navy-900/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Emblem className="h-8 w-8 transition-transform hover:scale-105" />
            <span className="font-display text-base tracking-widest text-parchment-50 sm:text-lg">
              DRAGONHOLD
            </span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded border border-gold-500/30 bg-navy-950/80 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold-400 lg:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
            Era I · Post-Dragon War
          </span>
        </div>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-parchment-200 transition-colors hover:text-gold-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User actions & mobile menu button */}
        <div className="flex min-h-9 items-center gap-2">
          {status === "authenticated" && me ? (
            <>
              <Link
                href="/dashboard"
                className="hidden max-w-40 truncate text-sm text-parchment-200 transition-colors hover:text-gold-300 sm:inline"
              >
                {me.citizen?.characterName ?? me.user.username}
              </Link>
              <Button variant="secondary" onClick={handleLogout} className="text-xs sm:text-sm">
                Sign out
              </Button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link
                href="/login"
                className={cx(
                  buttonStyles({ variant: "ghost" }),
                  "px-2 text-xs sm:px-3 sm:text-sm",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={cx(
                  buttonStyles(),
                  "px-3 text-xs sm:px-4 sm:text-sm",
                )}
              >
                Become Citizen
              </Link>
            </>
          ) : null}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="flex h-9 w-9 items-center justify-center rounded border border-navy-700 text-parchment-200 hover:border-gold-500 hover:text-gold-300 md:hidden"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen ? (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-navy-800 bg-navy-950/98 px-4 py-4 md:hidden shadow-2xl backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between border-b border-navy-800 pb-2">
            <span className="text-[11px] font-display uppercase tracking-widest text-gold-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
              Realm of Dragonhold
            </span>
            <span className="text-[11px] text-stone-400 font-mono">Episode 001</span>
          </div>
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded px-3 text-sm text-parchment-200 transition-colors hover:bg-gold-500/10 hover:text-gold-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {status === "authenticated" && me ? (
              <li className="border-t border-navy-800 pt-2 mt-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded px-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10"
                >
                  Citizen Record ({me.citizen?.characterName ?? me.user.username})
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}