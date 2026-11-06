import type { ReactNode } from "react";
import { CtaButtons } from "@/components/cta-buttons";
import { Emblem } from "@/components/emblem";
import { Panel } from "@/components/ui/panel";

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

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <Emblem className="h-24 w-24 sm:h-32 sm:w-32" />
        <h1 className="mt-8 text-5xl tracking-widest sm:text-7xl">DRAGONHOLD</h1>
        <p className="mt-4 font-display text-xl text-gold-300 sm:text-2xl">
          A Kingdom Yet to Be Written.
        </p>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-parchment-200">
          In the world of Aetherial, humanity is rebuilding after a war against the
          dragons. Dragonhold is a newly founded kingdom whose throne is empty and whose
          history is yet to be written. Become a citizen, and help write it.
        </p>
        <div className="mt-10">
          <CtaButtons showDiscover />
        </div>
      </section>

      {/* 2. World introduction */}
      <Section id="world" eyebrow="The World" title="Aetherial, After the War">
        <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-parchment-200">
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
          <Panel>
            <h3 className="text-lg">A War Remembered</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              The scars of the dragon war are fresh, and no one has forgotten them.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-lg">Dragons Unseen</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Seldom glimpsed, never dismissed. Their shadow still hangs over the world.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-lg">A World to Rebuild</h3>
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
          <div className="space-y-4 text-lg leading-relaxed text-parchment-200">
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
          <Panel variant="parchment">
            <h3 className="text-xl">Kingdom Status</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
                <dt>Status</dt>
                <dd className="font-semibold">Newly established</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
                <dt>First ruler</dt>
                <dd className="font-semibold">Not yet chosen</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-parchment-300 pb-2">
                <dt>Government</dt>
                <dd className="font-semibold">Not yet formed</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Chronicles</dt>
                <dd className="font-semibold">The first page is blank</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </Section>

      {/* 4. Government preview */}
      {/* TODO (Phase 3): ambil dari GET /government setelah struktur resmi ditetapkan */}
      <Section id="government" eyebrow="Government" title="A Government Yet to Be Formed">
        <p className="max-w-3xl text-lg leading-relaxed text-parchment-200">
          Dragonhold has no formed government. Offices and their holders will appear here once
          they are established.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Panel className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg">The Crown</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">
                The first king or queen of Dragonhold has not been chosen.
              </p>
            </div>
            <span className="shrink-0 border border-stone-400 px-2 py-0.5 text-xs uppercase tracking-wide text-stone-300">
              Vacant
            </span>
          </Panel>
          <Panel className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg">Other Offices</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">
                The structure of government has not yet been defined.
              </p>
            </div>
            <span className="shrink-0 border border-stone-400 px-2 py-0.5 text-xs uppercase tracking-wide text-stone-300">
              Not established
            </span>
          </Panel>
        </div>
      </Section>

      {/* 5. Community participation */}
      <Section id="participate" eyebrow="Community" title="Your Voice Will Shape the Realm">
        <p className="max-w-3xl text-lg leading-relaxed text-parchment-200">
          Dragonhold is not a kingdom you watch. Once the community is ready, citizens will
          take part in the decisions that define it.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel>
            <h3 className="text-lg">Elect</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Stand as a candidate or vote for who will hold the crown, once elections open.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-lg">Decide</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Vote on the matters that affect the whole kingdom whenever the realm calls on its
              citizens.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-lg">Be Remembered</h3>
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
      {/* TODO (Phase 3): ambil dari GET /announcements */}
      <Section id="announcements" eyebrow="Proclamations" title="Latest Announcements">
        <Panel className="text-stone-300">
          <p>No proclamations yet.</p>
          <p className="mt-1 text-sm text-stone-400">
            When the Creator or the crown speaks, it will be written here.
          </p>
        </Panel>
      </Section>
    </>
  );
}