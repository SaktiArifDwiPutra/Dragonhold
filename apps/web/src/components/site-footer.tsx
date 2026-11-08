import Link from "next/link";
import { socialLinks } from "@/lib/site-config";
import { Emblem } from "./emblem";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-navy-700 bg-navy-900 pb-20 sm:pb-0">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Emblem className="h-8 w-8" />
            <span className="font-display text-lg tracking-widest text-parchment-50">
              DRAGONHOLD
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-stone-300">
            A community-driven political fantasy kingdom in the world of Aetherial.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-display text-sm uppercase tracking-widest text-gold-400">
            Explore
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/#world" className="text-parchment-200 hover:text-gold-300">
                The World
              </Link>
            </li>
            <li>
              <Link href="/#kingdom" className="text-parchment-200 hover:text-gold-300">
                The Kingdom
              </Link>
            </li>
            <li>
              <Link href="/#government" className="text-parchment-200 hover:text-gold-300">
                Government
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-parchment-200 hover:text-gold-300">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-parchment-200 hover:text-gold-300">
                Become a Citizen
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm uppercase tracking-widest text-gold-400">
            Follow
          </h2>
          {socialLinks.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-parchment-200 hover:text-gold-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone-400">Our channels will be announced soon.</p>
          )}
        </div>
      </div>

      <div className="border-t border-navy-700 px-4 py-4 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} Dragonhold. Aetherial is a work of fiction.
      </div>
    </footer>
  );
}