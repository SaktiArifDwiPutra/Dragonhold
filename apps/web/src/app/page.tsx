import Link from "next/link";
import type { ReactNode } from "react";
import { CtaButtons } from "@/components/cta-buttons";
import { Emblem } from "@/components/emblem";
import { buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cx } from "@/lib/cx";

// TODO (Phase 3): ganti dengan data asli dari GET /government.
// Nama dan deskripsi jabatan ini masih usulan awal.
const plannedPositions = [
  {
    name: "Sovereign",
    description: "King or Queen of Dragonhold. The first ruler will be chosen by election.",
  },
  { name: "Chancellor", description: "Chief advisor to the crown." },
  { name: "Marshal", description: "Keeper of the kingdom's defence." },
  { name: "Steward", description: "Guardian of the kingdom's treasury." },
];

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
    <section id={id} className="scroll-mt-20 border-t-2 border-navy-800 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <p className="font-display text-sm uppercase tracking-widest text-gold-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
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
    <div className="pb-16 sm:pb-0">
      {/* 1. Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:py-24">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-gold-500/10 blur-xl" />
          <Emblem className="relative h-24 w-24 sm:h-32 sm:w-32 drop-shadow-[0_0_20px_rgba(234,179,8,0.25)] transition-transform hover:scale-105" />
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-navy-950/80 px-3 py-1 text-xs font-display tracking-widest text-gold-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
          <span>POLITICAL FANTASY REALM · EPISODE 001</span>
        </div>
        <h1 className="mt-4 text-4xl sm:text-6xl md:text-7xl tracking-widest font-display text-parchment-50">
          DRAGONHOLD
        </h1>
        <p className="mt-3 font-display text-lg text-gold-300 sm:text-2xl">
          A Kingdom Yet to Be Written.
        </p>
        <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-parchment-200">
          In the world of Aetherial, humanity is rebuilding after a war against the
          dragons. Dragonhold is a newly founded kingdom whose throne is empty and whose
          history is yet to be written. Become a citizen, and help write it.
        </p>

        {/* Quest Status HUD */}
        <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-2 border border-navy-700 bg-navy-950/90 p-2 text-center text-xs backdrop-blur-sm sm:max-w-lg sm:p-3">
          <div className="border-r border-navy-800 p-1">
            <p className="text-[10px] uppercase tracking-wider text-stone-400">Throne</p>
            <p className="mt-0.5 font-bold text-amber-400">VACANT</p>
          </div>
          <div className="border-r border-navy-800 p-1">
            <p className="text-[10px] uppercase tracking-wider text-stone-400">Status</p>
            <p className="mt-0.5 font-bold text-emerald-400">FOUNDED</p>
          </div>
          <div className="p-1">
            <p className="text-[10px] uppercase tracking-wider text-stone-400">Chronicle</p>
            <p className="mt-0.5 font-bold text-gold-300">BLANK</p>
          </div>
        </div>

        <div className="mt-8 w-full sm:w-auto">
          <CtaButtons showDiscover />
        </div>
      </section>

      {/* 2. World introduction */}
      <Section id="world" eyebrow="The World" title="Aetherial, After the War">
        <div className="max-w-3xl space-y-4 text-base sm:text-lg leading-relaxed text-parchment-200">
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
          <Panel brackets variant="hud">
            <h3 className="text-lg font-bold text-gold-300">A War Remembered</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              The scars of the dragon war are fresh, and no one has forgotten them.
            </p>
          </Panel>
          <Panel brackets variant="hud">
            <h3 className="text-lg font-bold text-gold-300">Dragons Unseen</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Seldom glimpsed, never dismissed. Their shadow still hangs over the world.
            </p>
          </Panel>
          <Panel brackets variant="hud">
            <h3 className="text-lg font-bold text-gold-300">A World to Rebuild</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Humanity has been given a chance to start again, and a kingdom to start it in.
            </p>
          </Panel>
        </div>
      </Section>

      {/* 3. Kingdom overview */}
      {/* TODO (Phase 3): baca status ini dari GET /kingdom */}
      <Section id="kingdom" eyebrow="The Kingdom" title="Dragonhold, Newly Founded">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-parchment-200">
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
          <Panel variant="parchment" brackets>
            <h3 className="text-xl font-bold">Kingdom Status</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
                <dt className="text-stone-700">Status</dt>
                <dd className="font-semibold text-emerald-800">Newly established</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
                <dt className="text-stone-700">First ruler</dt>
                <dd className="font-semibold text-amber-800">Not yet chosen (Vacant)</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
                <dt className="text-stone-700">Government</dt>
                <dd className="font-semibold text-stone-800">Not yet formed</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-700">Chronicles</dt>
                <dd className="font-semibold text-stone-800">The first page is blank</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </Section>

      {/* 4. Government preview */}
      {/* TODO (Phase 3): ambil dari GET /government setelah struktur resmi ditetapkan */}
      <Section id="government" eyebrow="Government" title="A Government Yet to Be Formed">
        <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-parchment-200">
          Dragonhold has no formed government. Offices and their holders will appear here once
          they are established.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Panel brackets variant="hud" className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gold-300">The Crown</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">
                The first king or queen of Dragonhold has not been chosen.
              </p>
            </div>
            <span className="shrink-0 rounded border border-amber-500/60 bg-amber-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              Vacant
            </span>
          </Panel>
          <Panel brackets variant="hud" className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gold-300">Other Offices</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">
                The structure of government has not yet been defined.
              </p>
            </div>
            <span className="shrink-0 rounded border border-stone-500 bg-stone-500/10 px-2.5 py-1 text-xs uppercase tracking-wider text-stone-300">
              Not established
            </span>
          </Panel>
        </div>
      </Section>

      {/* 5. Community participation */}
      <Section id="participate" eyebrow="Community" title="Your Voice Will Shape the Realm">
        <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-parchment-200">
          Dragonhold is not a kingdom you watch. Once the community is ready, citizens will
          take part in the decisions that define it.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel brackets variant="hud">
            <h3 className="text-lg font-bold text-gold-300">Elect</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Stand as a candidate or vote for who will hold the crown, once elections open.
            </p>
          </Panel>
          <Panel brackets variant="hud">
            <h3 className="text-lg font-bold text-gold-300">Decide</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Vote on the matters that affect the whole kingdom whenever the realm calls on its
              citizens.
            </p>
          </Panel>
          <Panel brackets variant="hud">
            <h3 className="text-lg font-bold text-gold-300">Be Remembered</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              What the kingdom decides is recorded in its chronicles, and those records stay.
            </p>
          </Panel>
        </div>
        <div className="mt-10">
          <CtaButtons />
        </div>
      </Section>

      {/* 6. Latest announcements */}
      <Section id="announcements" eyebrow="Proclamations" title="Latest Announcements">
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((item) => (
              <Panel key={item.id} variant="parchment" brackets className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-parchment-300 pb-2">
                  <span className="font-display text-xs font-semibold uppercase tracking-wider text-gold-700">
                    📜 {item.category.replace(/_/g, " ")}
                  </span>
                  {item.publishedAt ? (
                    <span className="text-xs text-stone-600 font-mono">
                      {new Date(item.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-stone-800">
                  {item.content}
                </p>
              </Panel>
            ))}
          </div>
        ) : (
          <Panel brackets variant="hud" className="text-stone-300">
            <p className="font-semibold text-gold-400">No proclamations yet.</p>
            <p className="mt-1 text-sm text-stone-400">
              When the Creator or the crown speaks, it will be written here.
            </p>
          </Panel>
        )}
      </Section>

      {/* 7. Mobile Sticky Quick-Action Bar (80% mobile viewers ergonomics) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-gold-500/40 bg-navy-950/95 p-3 backdrop-blur-md sm:hidden shadow-2xl">
        <div className="flex items-center gap-2.5 pl-1">
          <Emblem className="h-7 w-7" />
          <div className="text-left">
            <p className="font-display text-[10px] uppercase tracking-wider text-gold-400">Dragonhold</p>
            <p className="text-xs font-semibold text-parchment-100">Episode 001</p>
          </div>
        </div>
        <Link
          href="/register"
          className={cx(
            buttonStyles({ size: "md" }),
            "px-4 py-2 text-xs font-bold shadow-md",
          )}
        >
          Become Citizen
        </Link>
      </div>
    </div>
  );
}