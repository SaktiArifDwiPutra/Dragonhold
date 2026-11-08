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
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-canvas-border py-16">
      <div className="mx-auto max-w-5xl px-4">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-gold-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-serif text-parchment-50">{title}</h2>
        <div className="mt-6">{children}</div>
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
      {/* 1. Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:py-24">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-gold-sovereign/10 blur-xl pointer-events-none" />
          <div className="relative p-3 border border-gold-sovereign/30 bg-canvas-surface shadow-[0_0_30px_rgba(200,162,83,0.12)]">
            <span className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-gold-sovereign" />
            <span className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-gold-sovereign" />
            <Emblem className="h-20 w-20 sm:h-28 sm:w-28 drop-shadow-md transition-transform hover:scale-105" />
          </div>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded border border-gold-sovereign/30 bg-canvas-base px-3 py-1 font-mono text-xs uppercase tracking-widest text-gold-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-sovereign" />
          <span>POLITICAL FANTASY REALM · EPISODE 001</span>
        </div>

        <h1 className="mt-4 text-4xl sm:text-6xl md:text-7xl font-serif tracking-widest text-parchment-50">
          DRAGONHOLD
        </h1>

        <p className="mt-3 font-serif text-lg text-gold-300 sm:text-2xl">
          A Kingdom Yet to Be Written.
        </p>

        <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-stone-300">
          In the world of Aetherial, humanity is rebuilding after a devastating war against the dragons.
          Dragonhold is a newly founded kingdom whose throne is empty and whose history is yet to be written.
          Become a citizen, and help write it.
        </p>

        {/* 3-Entry Canonical Realm State HUD (No fake data or filler 4th cards) */}
        <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-2 border border-canvas-border bg-canvas-surface/90 p-2 text-center text-xs backdrop-blur-sm sm:max-w-xl sm:p-3 shadow-lg">
          <div className="border-r border-canvas-border p-1.5 sm:p-2">
            <p className="font-sans text-[10px] uppercase tracking-wider text-stone-400">Throne</p>
            <p className="mt-0.5 font-sans font-bold text-amber-400 sm:text-sm">VACANT</p>
            <p className="hidden text-[9px] text-stone-500 sm:block">Interregnum</p>
          </div>
          <div className="border-r border-canvas-border p-1.5 sm:p-2">
            <p className="font-sans text-[10px] uppercase tracking-wider text-stone-400">Status</p>
            <p className="mt-0.5 font-sans font-bold text-emerald-400 sm:text-sm">NEWLY ESTABLISHED</p>
            <p className="hidden text-[9px] text-stone-500 sm:block">Era I · Post-War</p>
          </div>
          <div className="p-1.5 sm:p-2">
            <p className="font-sans text-[10px] uppercase tracking-wider text-stone-400">Chronicles</p>
            <p className="mt-0.5 font-sans font-bold text-gold-300 sm:text-sm">BLANK</p>
            <p className="hidden text-[9px] text-stone-500 sm:block">Awaiting First Record</p>
          </div>
        </div>

        <div className="mt-8 w-full sm:w-auto">
          <CtaButtons showDiscover />
        </div>
      </section>

      {/* 2. World introduction */}
      <Section id="world" eyebrow="The World" title="Aetherial, After the War">
        <div className="max-w-3xl space-y-4 text-base sm:text-lg leading-relaxed text-stone-300">
          <p>
            Not long ago, humanity fought a devastating war against the dragons. In
            Aetherial, dragons are not rumours or bedtime stories. People know they exist,
            remember the destruction they caused, and fear them still.
          </p>
          <p>
            Yet the dragons are rarely seen. Their absence has not brought peace of mind,
            only mystery and unease. Now the survivors are trying to rebuild what was lost.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel variant="dark">
            <h3 className="font-serif text-lg font-bold text-gold-300">A War Remembered</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              The scars of the dragon war are fresh, and no one has forgotten them.
            </p>
          </Panel>
          <Panel variant="dark" brackets>
            <h3 className="font-serif text-lg font-bold text-gold-300">Dragons Unseen</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Seldom glimpsed, never dismissed. Their shadow still hangs over the world.
            </p>
          </Panel>
          <Panel variant="dark">
            <h3 className="font-serif text-lg font-bold text-gold-300">A World to Rebuild</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Humanity has been given a chance to start again, and a kingdom to start it in.
            </p>
          </Panel>
        </div>
      </Section>

      {/* 3. Kingdom overview */}
      <Section id="kingdom" eyebrow="The Kingdom" title="Dragonhold, Newly Founded">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-stone-300">
            <p>
              Dragonhold was founded by the Creator, the divine creator of Aetherial, to give
              humanity an opportunity to rebuild its civilization.
            </p>
            <p>
              The Creator does not rule Dragonhold. Who deserves to be its first king or
              queen is a question still unanswered, and it is meant to be answered by the
              people who live there.
            </p>
          </div>
          <Panel variant="dark" brackets>
            <h3 className="font-serif text-xl font-bold text-gold-300">Kingdom Status</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2">
                <dt className="text-stone-400">Status</dt>
                <dd className="font-semibold text-emerald-400">NEWLY ESTABLISHED</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2">
                <dt className="text-stone-400">First ruler</dt>
                <dd className="font-semibold text-amber-400">Not yet chosen (Vacant)</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-canvas-border pb-2">
                <dt className="text-stone-400">Government</dt>
                <dd className="font-semibold text-stone-300">Not yet formed</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-400">Chronicles</dt>
                <dd className="font-semibold text-gold-300">The first page is blank</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </Section>

      {/* 4. Government preview */}
      <Section id="government" eyebrow="Government" title="A Government Yet to Be Formed">
        <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-stone-300">
          Dragonhold has no formed government. Offices and their holders will appear here once
          they are established.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Panel variant="dark" className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-gold-300">The Crown</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                The first king or queen of Dragonhold has not been chosen.
              </p>
            </div>
            <span className="shrink-0 rounded border border-amber-500/60 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
              Vacant
            </span>
          </Panel>
          <Panel variant="dark" className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-gold-300">Other Offices</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                The structure of government has not yet been defined.
              </p>
            </div>
            <span className="shrink-0 rounded border border-stone-600 bg-stone-700/20 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-stone-400">
              Not established
            </span>
          </Panel>
        </div>
      </Section>

      {/* 5. Community participation */}
      <Section id="participate" eyebrow="Community" title="Your Voice Will Shape the Realm">
        <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-stone-300">
          Dragonhold is not a kingdom you watch. Once the community is ready, citizens will
          take part in the decisions that define it.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel variant="dark">
            <h3 className="font-serif text-lg font-bold text-gold-300">Elect</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Stand as a candidate or vote for who will hold the crown, once elections open.
            </p>
          </Panel>
          <Panel variant="dark">
            <h3 className="font-serif text-lg font-bold text-gold-300">Decide</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Vote on the matters that affect the whole kingdom whenever the realm calls on its
              citizens.
            </p>
          </Panel>
          <Panel variant="dark">
            <h3 className="font-serif text-lg font-bold text-gold-300">Be Remembered</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              What the kingdom decides is recorded in its chronicles, and those records stay.
            </p>
          </Panel>
        </div>
        <div className="mt-10">
          <CtaButtons />
        </div>
      </Section>

      {/* 6. Latest announcements (Authentic Parchment Proclamation with Wax Seal) */}
      <Section id="announcements" eyebrow="Proclamations" title="Latest Announcements">
        {announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="parchment-sheet relative p-6 sm:p-8 transition-all duration-200"
              >
                {/* Top header with category and wax seal mark */}
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
                    <span className="font-serif text-sm font-bold">DH</span>
                  </div>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#1f1d1a] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm sm:text-base leading-relaxed text-[#2c2825]">
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
            <p className="font-serif font-bold text-gold-400">No proclamations yet.</p>
            <p className="mt-1 text-sm text-stone-400">
              When the Creator or the crown speaks, it will be written here.
            </p>
          </Panel>
        )}
      </Section>

      {/* 7. Public Mobile Sticky Quick-Action Bar (Safe-Area Insets & 48px Touch Targets) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-gold-sovereign/30 bg-canvas-base/95 p-3.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden shadow-2xl">
        <div className="flex items-center gap-2.5 pl-1">
          <Emblem className="h-7 w-7" />
          <div className="text-left">
            <p className="font-serif text-xs uppercase tracking-wider text-gold-400">Dragonhold</p>
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
          Become Citizen
        </Link>
      </div>
    </div>
  );
}
