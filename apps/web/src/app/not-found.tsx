import Link from "next/link";
import { Emblem } from "@/components/emblem";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <Emblem className="h-14 w-14 opacity-80" />
      <p className="font-mono text-xs uppercase tracking-widest text-gold-400">404 · Uncharted</p>
      <h1 className="font-display text-3xl tracking-wider text-parchment-50">This road leads nowhere</h1>
      <p className="max-w-sm font-serif text-stone-400">The page you seek is not written in the chronicle.</p>
      <Link href="/" className={buttonStyles()}>Return to the Gates</Link>
    </div>
  );
}
