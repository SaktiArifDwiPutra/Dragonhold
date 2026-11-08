import Link from "next/link";
import { socialLinks } from "@/lib/site-config";
import { Emblem } from "./emblem";

const linkClass =
  "inline-flex min-h-11 items-center text-sm text-stone-300 transition-colors hover:text-gold-300";

export function SiteFooter() {
  return (
    <footer className="border-t border-gold-sovereign/20 bg-canvas-surface">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3 sm:py-12">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Emblem className="h-8 w-8 shrink-0" />
            <span className="font-display text-lg tracking-[0.18em] text-parchment-50">
              DRAGONHOLD
            </span>
          </div>
          <p className="mt-4 max-w-xs font-serif text-sm leading-relaxed text-stone-400">
            A kingdom yet to be written, in the world of Aetherial.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-mono text-xs uppercase tracking-widest text-gold-400">Explore</h2>
          <ul className="mt-2">
            <li><Link href="/#chapter" className={linkClass}>Episode 001</Link></li>
            <li><Link href="/#world" className={linkClass}>The World</Link></li>
            <li><Link href="/#kingdom" className={linkClass}>The Kingdom</Link></li>
            <li><Link href="/login" className={linkClass}>Sign in</Link></li>
            <li><Link href="/register" className={linkClass}>Enter the Kingdom</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-gold-400">Follow</h2>
          {socialLinks.length > 0 ? (
            <ul className="mt-2">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Our channels will be announced soon.</p>
          )}
        </div>
      </div>

      <div className="border-t border-canvas-border px-4 py-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Dragonhold. Aetherial is a work of fiction.
      </div>
    </footer>
  );
}
