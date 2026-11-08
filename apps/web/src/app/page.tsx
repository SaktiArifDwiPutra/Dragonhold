import Link from "next/link";
import type { ReactNode } from "react";
import { CtaButtons } from "@/components/cta-buttons";
import { Emblem } from "@/components/emblem";
import { buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cx } from "@/lib/cx";

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cx("scroll-mt-20 border-t border-canvas-border py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-5xl px-4">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-gold-400">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-display tracking-wider text-parchment-50">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-stone-400 font-serif">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="mt-8 sm:mt-12">{children}</div>
      </div>
    </section>
  );
}

type Announcement = {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string | null;
  createdAt: string;
};

async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:4000";
    const res = await fetch(`${apiUrl}/announcements`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.announcements ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const announcements = await getAnnouncements();

  return (
    <div className="pb-28 sm:pb-0">
      {/* SECTION 1: CINEMATIC HERO — THE GATES OF DRAGONHOLD */}
      <section className="relative min-h-[92vh] sm:min-h-[88vh] flex flex-col justify-end overflow-hidden border-b border-canvas-border">
        {/* Background Artwork Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-gates.jpg"
            alt="The Grand Entrance and mountain citadel of Dragonhold at moody dawn"
            className="h-full w-full object-cover object-center filter brightness-85 contrast-110 scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Cinematic Vignettes and Atmospheric Fog Layers */}
          <div className="absolute inset-0 bg-gradient-to-t from-canvas-base via-canvas-base/60 to-transparent" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-canvas-base/30 to-canvas-base/90 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-canvas-base/90 to-transparent" />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-12 pt-28 sm:pb-20 sm:pt-36 flex flex-col items-center text-center">
          {/* Dragonhold Crest Badge */}
          <div className="relative mb-5 p-3.5 border border-gold-sovereign/40 bg-canvas-base/80 backdrop-blur-md shadow-[0_0_35px_rgba(200,162,83,0.2)]">
            <span className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-sovereign" />
            <Emblem className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-md" />
          </div>

          <div className="inline-flex items-center gap-2 rounded border border-gold-sovereign/40 bg-canvas-base/90 px-3.5 py-1 font-mono text-[11px] uppercase tracking-widest text-gold-300 backdrop-blur-sm shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-sovereign" />
            <span>AETHERIAL REALM · ERA I</span>
          </div>

          <h1 className="mt-4 text-4xl sm:text-6xl md:text-7xl font-display tracking-widest text-parchment-50 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            DRAGONHOLD
          </h1>

          <p className="mt-3 font-serif text-lg sm:text-2xl text-gold-300 drop-shadow-md">
            A Kingdom Yet to Be Written.
          </p>

          <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-stone-300 drop-shadow">
            Standing before the mist-shrouded gates of a newly founded realm. Humanity is rebuilding in the wake of the Great Dragon War. The High Throne sits empty, waiting for its people to forge its history.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cx(
                buttonStyles({ size: "lg" }),
                "w-full sm:w-auto px-8 text-center text-sm tracking-wider font-bold shadow-xl",
              )}
            >
              Enter the Kingdom
            </Link>
            <Link
              href="#chapter"
              className={cx(
                buttonStyles({ variant: "secondary", size: "lg" }),
                "w-full sm:w-auto px-6 text-center text-sm",
              )}
            >
              Explore the World
            </Link>
          </div>

          {/* Canonical 3-Stat Realm HUD */}
          <div className="mt-10 grid w-full max-w-lg grid-cols-3 gap-2 border border-canvas-border bg-canvas-base/90 p-2 sm:p-3 text-center text-xs backdrop-blur-md shadow-2xl">
            <div className="border-r border-canvas-border p-1.5 sm:p-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">Throne</p>
              <p className="mt-0.5 font-sans font-bold text-amber-400 sm:text-sm">VACANT</p>
              <p className="hidden text-[9px] text-stone-500 sm:block">Interregnum</p>
            </div>
            <div className="border-r border-canvas-border p-1.5 sm:p-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">Status</p>
              <p className="mt-0.5 font-sans font-bold text-emerald-400 sm:text-sm">NEWLY ESTABLISHED</p>
              <p className="hidden text-[9px] text-stone-500 sm:block">Post-War</p>
            </div>
            <div className="p-1.5 sm:p-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">Chronicles</p>
              <p className="mt-0.5 font-sans font-bold text-gold-300 sm:text-sm">BLANK</p>
              <p className="hidden text-[9px] text-stone-500 sm:block">Unwritten</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURED STORY / CURRENT CHAPTER — EPISODE 001 */}
      <section id="chapter" className="scroll-mt-20 border-t border-canvas-border py-16 sm:py-24 bg-canvas-surface/60">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Chapter Artwork Container */}
            <div className="relative overflow-hidden border border-gold-sovereign/30 bg-canvas-base shadow-2xl lg:col-span-7 group">
              <div className="aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
                <img
                  src="/images/episode-001.jpg"
                  alt="Episode 001: The Cessation of Dragonfire aftermath in Aetherial"
                  className="h-full w-full object-cover filter brightness-90 contrast-105 transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-canvas-base via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-gold-300">
                <span className="bg-canvas-base/80 px-2 py-1 border border-gold-sovereign/40">CHAPTER COVER · ARTWORK</span>
                <span className="bg-canvas-base/80 px-2 py-1 border border-gold-sovereign/40">EPISODE 001</span>
              </div>
            </div>

            {/* Chapter Lore & Description */}
            <div className="flex flex-col justify-center lg:col-span-5">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gold-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-sovereign" />
                <span>CURRENT CHAPTER</span>
              </div>

              <h2 className="mt-2 text-2xl sm:text-3xl font-display tracking-wider text-parchment-50 leading-tight">
                Episode 001: The Cessation of Dragonfire
              </h2>

              <p className="mt-4 font-serif text-base leading-relaxed text-stone-300">
                The colossal shadow has fallen, but the earth still smolders. As the last dragonfire fades from the mountain crests, the survivors gather at the gates of Dragonhold.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                With the ancient kings lost and the throne room quiet, the Creator beckons humanity to take up the mantle. No divine ruler will decide the realm’s fate — the future belongs to those who step forward.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="#announcements"
                  className={cx(buttonStyles({ variant: "secondary", size: "md" }), "text-xs")}
                >
                  Read the Proclamations
                </Link>
                <Link
                  href="/register"
                  className={cx(buttonStyles({ size: "md" }), "text-xs")}
                >
                  Join the Chronicle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WORLD OF AETHERIAL — ATLAS & REGIONAL EXPLORATION */}
      <Section
        id="world"
        eyebrow="The World"
        title="Atlas of Aetherial"
        subtitle="Explore the lands scarred by the war against dragons, where humanity now carves its future."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative border border-canvas-border bg-canvas-surface p-5 transition-all hover:border-gold-sovereign/50 hover:shadow-lg">
            <span className="font-mono text-xs font-bold text-gold-400">PROVINCE I</span>
            <h3 className="mt-2 text-lg font-display text-parchment-50">Dragonhold Citadel</h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-400 leading-relaxed">
              Carved directly into the sheer granite of the Wyrmtooth Range, this mountain fortress serves as humanity's first sovereign sanctuary.
            </p>
            <div className="mt-4 pt-3 border-t border-canvas-border flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span>Status: Founded</span>
              <span className="text-emerald-400">Secure</span>
            </div>
          </div>

          <div className="relative border border-canvas-border bg-canvas-surface p-5 transition-all hover:border-gold-sovereign/50 hover:shadow-lg">
            <span className="font-mono text-xs font-bold text-gold-400">PROVINCE II</span>
            <h3 className="mt-2 text-lg font-display text-parchment-50">The Ashen Wastes</h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-400 leading-relaxed">
              The desolate lowlands where the final dragon confrontation ended. Smoldering rifts and dragonbone relics remain unexcavated.
            </p>
            <div className="mt-4 pt-3 border-t border-canvas-border flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span>Status: Scourged</span>
              <span className="text-amber-400">Unsettled</span>
            </div>
          </div>

          <div className="relative border border-canvas-border bg-canvas-surface p-5 transition-all hover:border-gold-sovereign/50 hover:shadow-lg">
            <span className="font-mono text-xs font-bold text-gold-400">PROVINCE III</span>
            <h3 className="mt-2 text-lg font-display text-parchment-50">The Vault Chancery</h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-400 leading-relaxed">
              Subterranean archives housing historical scrolls, treaties, and the official citizen cartulary under lock and seal.
            </p>
            <div className="mt-4 pt-3 border-t border-canvas-border flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span>Status: Intact</span>
              <span className="text-emerald-400">Guarded</span>
            </div>
          </div>

          <div className="relative border border-canvas-border bg-canvas-surface p-5 transition-all hover:border-gold-sovereign/50 hover:shadow-lg">
            <span className="font-mono text-xs font-bold text-gold-400">PROVINCE IV</span>
            <h3 className="mt-2 text-lg font-display text-parchment-50">The Uncharted Marches</h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-400 leading-relaxed">
              Vast untamed territories stretching beyond the frontier. Future expeditions and territorial charters await citizen votes.
            </p>
            <div className="mt-4 pt-3 border-t border-canvas-border flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span>Status: Unknown</span>
              <span className="text-stone-400">Frontier</span>
            </div>
          </div>
        </div>
      </Section>

      {/* SECTION 4: THE KINGDOM'S CURRENT STATE — ENVIRONMENTAL STORYTELLING */}
      <Section
        id="kingdom"
        eyebrow="The Realm"
        title="The Vacant High Throne"
        subtitle="A seat of sovereignty waiting for its first elected monarch."
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Vacant Throne Environmental Lore Container */}
          <div className="border border-canvas-border bg-canvas-surface p-6 sm:p-8 lg:col-span-7 shadow-xl">
            <span className="font-mono text-xs uppercase tracking-widest text-gold-400">
              INTERREGNUM · ERA I
            </span>
            <h3 className="mt-2 text-2xl font-display text-parchment-50">
              The Crown Remains Unclaimed
            </h3>
            <div className="mt-4 space-y-3 font-serif text-sm sm:text-base leading-relaxed text-stone-300">
              <p>
                Dragonhold was founded by the Creator to give humanity a chance to rebuild civilization after the cataclysm.
              </p>
              <p>
                Yet the throne room stands quiet. There is no monarch by divine right, no hereditary lineage to dictate decrees. The first king or queen of Dragonhold will be determined through citizen participation and election when the realm is ready.
              </p>
              <p className="text-stone-400 italic">
                "A kingdom without a tyrant is a kingdom where every citizen bears the crown of responsibility."
              </p>
            </div>
          </div>

          {/* Official State Matrix */}
          <div className="border border-gold-sovereign/30 bg-canvas-base p-6 sm:p-8 lg:col-span-5 shadow-2xl relative">
            <span className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-sovereign" />
            
            <h4 className="font-display text-lg text-gold-300 uppercase tracking-wider">
              State of the Realm
            </h4>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2.5">
                <dt className="text-stone-400">Kingdom Status</dt>
                <dd className="font-mono font-bold text-emerald-400">NEWLY ESTABLISHED</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2.5">
                <dt className="text-stone-400">High Throne</dt>
                <dd className="font-mono font-bold text-amber-400">VACANT</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2.5">
                <dt className="text-stone-400">Sovereign Office</dt>
                <dd className="text-stone-300">Not yet formed</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2.5">
                <dt className="text-stone-400">Realm Chronicles</dt>
                <dd className="font-mono text-gold-300">BLANK</dd>
              </div>
              <div className="flex justify-between gap-4 pt-1">
                <dt className="text-stone-400">First Proclamation</dt>
                <dd className="text-stone-300">Episode 001 Ready</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      {/* SECTION 5: BECOME PART OF THE CHRONICLE — CEREMONIAL INVITATION */}
      <section id="participate" className="scroll-mt-20 border-t border-canvas-border py-16 sm:py-24 bg-gradient-to-b from-canvas-surface to-canvas-base">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gold-400">
            <span>ROYAL CARTULARY ENLISTMENT</span>
          </div>

          <h2 className="mt-3 text-3xl sm:text-5xl font-display tracking-widest text-parchment-50">
            Become Part of the Chronicle
          </h2>

          <p className="mt-4 max-w-2xl mx-auto font-serif text-base sm:text-lg leading-relaxed text-stone-300">
            Registration in Dragonhold is not merely creating an account. It is entering the world of Aetherial and taking an oath of citizenship.
          </p>

          <p className="mt-2 text-sm text-stone-400">
            Upon entering, an indelible Citizen ID (<span className="font-mono text-gold-300 font-bold">DH-000001</span> format) is sealed to your name, granting official standing in future realm votes and decrees.
          </p>

          <div className="mt-8 flex justify-center">
            <CtaButtons />
          </div>
        </div>
      </section>

      {/* SECTION 6: LATEST ANNOUNCEMENTS — ROYAL PROCLAMATIONS RELIC */}
      <Section
        id="announcements"
        eyebrow="Proclamations"
        title="Royal Dispatches & Decrees"
        subtitle="Official statements issued from the Chancery Vault of Dragonhold."
      >
        {announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="parchment-sheet relative p-6 sm:p-8 transition-all duration-200"
              >
                {/* Header with Category and Wax Seal */}
                <div className="flex items-start justify-between gap-4 border-b border-[#c2b28c] pb-3 mb-4">
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#633f19]">
                      📜 {item.category.replace(/_/g, " ")}
                    </span>
                    {item.publishedAt ? (
                      <p className="text-xs font-mono text-[#5c4300] mt-0.5">
                        {new Date(item.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    ) : null}
                  </div>
                  {/* Wax Seal Signet Accent */}
                  <div
                    aria-label="Official Imperial Seal"
                    className="wax-seal flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-parchment-50 shadow-md"
                  >
                    <span className="font-display text-sm font-bold">DH</span>
                  </div>
                </div>

                <h3 className="font-display text-2xl font-bold text-[#1f1d1a] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm sm:text-base leading-relaxed text-[#2c2825] font-serif">
                  {item.content}
                </p>

                <div className="mt-5 pt-3 border-t border-[#d4c49e] flex items-center justify-between text-xs text-[#5c4300] font-medium">
                  <span>Archival Record · High Realm of Aetherial</span>
                  <span className="font-mono uppercase text-[10px]">Vault Verified</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Panel variant="dark" brackets className="text-stone-300">
            <p className="font-display font-bold text-gold-400">No proclamations yet.</p>
            <p className="mt-1 text-sm text-stone-400">
              When the Creator or the crown speaks, it will be sealed here.
            </p>
          </Panel>
        )}
      </Section>

      {/* SECTION 7: PUBLIC MOBILE STICKY DOCK (Strict 48px touch targets & Safe-Area Insets) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-gold-sovereign/30 bg-canvas-base/95 p-3.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden shadow-2xl">
        <div className="flex items-center gap-2.5 pl-1">
          <Emblem className="h-7 w-7" />
          <div className="text-left">
            <p className="font-display text-xs uppercase tracking-wider text-gold-400">Dragonhold</p>
            <p className="font-sans text-[11px] text-stone-300">Episode 001</p>
          </div>
        </div>
        <Link
          href="/register"
          className={cx(
            buttonStyles({ size: "md" }),
            "px-4 text-xs font-bold shadow-md",
          )}
        >
          Enter Kingdom
        </Link>
      </div>
    </div>
  );
}
