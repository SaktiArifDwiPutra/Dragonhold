"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth/auth-provider";
import { Emblem } from "./emblem";
import { Button, buttonStyles } from "./ui/button";

const NAV = [
  { href: "/#world", label: "World" },
  { href: "/#kingdom", label: "Kingdom" },
  { href: "/#government", label: "Government" },
  { href: "/#participate", label: "Community" },
];

export function SiteHeader() {
  const { status, me, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b-2 border-navy-700 bg-navy-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Emblem className="h-8 w-8" />
          <span className="hidden font-display text-lg tracking-widest text-parchment-50 sm:inline">
            DRAGONHOLD
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-parchment-200 hover:text-gold-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-h-9 items-center gap-2">
          {status === "authenticated" && me ? (
            <>
              <Link
                href="/dashboard"
                className="hidden max-w-40 truncate text-sm text-parchment-200 hover:text-gold-300 sm:inline"
              >
                {me.citizen?.characterName ?? me.user.username}
              </Link>
              <Button variant="secondary" onClick={handleLogout}>
                Sign out
              </Button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link href="/login" className={buttonStyles({ variant: "ghost" })}>
                Sign in
              </Link>
              <Link href="/register" className={buttonStyles()}>
                Become a Citizen
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}