"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth/auth-provider";
import { Emblem } from "./emblem";
import { LanguageSwitcher } from "./language-switcher";
import { Button, buttonStyles } from "./ui/button";
import { cx } from "@/lib/cx";
import { useLanguage } from "@/lib/i18n";

export function SiteHeader() {
  const { status, me, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/#chapter", label: t.header.nav.chapter },
    { href: "/#world", label: t.header.nav.world },
    { href: "/#kingdom", label: t.header.nav.kingdom },
    { href: "/#announcements", label: t.header.nav.proclamations },
    { href: "/voting", label: t.header.nav.voting },
  ];

  // Close the drawer on navigation and on Escape
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
  }

  const authed = status === "authenticated" && me;
  const isAdmin =
    authed && (me.user.role === "ADMIN" || me.user.role === "SUPER_ADMIN");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gold-sovereign/20 bg-canvas-base/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4">
        {/* Brand: may shrink (truncate), never pushes the controls out */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Dragonhold home">
          <Emblem className="h-7 w-7 shrink-0" />
          <span className="truncate font-display text-[15px] tracking-[0.18em] text-parchment-50 sm:text-lg">
            {t.common.dragonhold}
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-stone-300 transition-colors hover:text-gold-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />

          {/* Desktop auth actions; on mobile these live in the drawer */}
          <div className="hidden items-center gap-2 md:flex">
            {authed ? (
              <>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="font-mono text-xs uppercase tracking-wider text-gold-300 hover:text-gold-400"
                  >
                    {t.header.admin}
                  </Link>
                ) : null}
                <Link
                  href="/dashboard"
                  className="max-w-36 truncate text-sm font-medium text-stone-300 hover:text-gold-300"
                >
                  {me.citizen?.characterName ?? me.user.username}
                </Link>
                <Button variant="secondary" onClick={handleLogout}>
                  {t.common.signOut}
                </Button>
              </>
            ) : status === "anonymous" ? (
              <>
                <Link href="/login" className={buttonStyles({ variant: "ghost" })}>
                  {t.common.signIn}
                </Link>
                <Link href="/register" className={buttonStyles()}>
                  {t.common.enterKingdom}
                </Link>
              </>
            ) : null}
          </div>

          {/* Menu toggle: fixed square, icon can never wrap or shrink */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.header.closeMenu : t.header.openMenu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-gold-sovereign/40 bg-canvas-surface text-gold-300 transition-colors hover:border-gold-sovereign active:bg-canvas-subtle md:hidden"
          >
            <svg
              className="block h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-gold-sovereign/30 bg-canvas-base shadow-2xl md:hidden"
        >
          <nav aria-label="Mobile" className="px-4 pt-2">
            <ul>
              {navItems.map((item) => (
                <li key={item.href} className="border-b border-gold-sovereign/15 last:border-b-0">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-between font-display text-sm uppercase tracking-widest text-stone-200 hover:text-gold-300"
                  >
                    {item.label}
                    <span aria-hidden className="text-gold-sovereign/60">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-3 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            {authed ? (
              <>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className={cx(buttonStyles(), "w-full")}
                  >
                    {t.common.adminConsole}
                  </Link>
                ) : null}
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={cx(
                    buttonStyles({ variant: isAdmin ? "secondary" : "primary" }),
                    "w-full",
                  )}
                >
                  {t.common.kingdomHall}
                </Link>
                <Button variant="secondary" onClick={handleLogout} className="w-full">
                  {t.common.signOut}
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={cx(buttonStyles(), "w-full")}
                >
                  {t.common.enterKingdom}
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={cx(buttonStyles({ variant: "secondary" }), "w-full")}
                >
                  {t.common.signIn}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
