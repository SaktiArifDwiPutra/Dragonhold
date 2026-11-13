"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Emblem } from "@/components/emblem";
import { buttonStyles } from "@/components/ui/button";
import { api, errorText } from "@/lib/api";
import { cx } from "@/lib/cx";

type PollType = "LEADERSHIP_ELECTION" | "KINGDOM_DECISION";
type PollStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";
type PollResultsVisibility = "HIDDEN" | "PUBLISHED" | "ARCHIVED";

type PublicPollOptionSafe = {
  id: string;
  label: string;
  shortDescription: string;
  details: string;
  imageUrl: string | null;
  displayOrder: number;
};

type PublicPollOptionWithResult = PublicPollOptionSafe & {
  voteCount: number;
  percentage: number;
};

type PublicPollCard = {
  id: string;
  title: string;
  description: string;
  type: PollType;
  status: PollStatus;
  resultsVisibility: PollResultsVisibility;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  openedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  resultsPublishedAt: string | null;
  resultsWithdrawnAt: string | null;
  createdAt: string;
  hasVoted: boolean;
  options: PublicPollOptionSafe[];
  results: {
    totalVotes: number;
    options: PublicPollOptionWithResult[];
  } | null;
};

type PublicVotingOverviewResponse = {
  activePolls: PublicPollCard[];
  publishedPolls: PublicPollCard[];
  closedPendingPolls: PublicPollCard[];
  cancelledPolls: PublicPollCard[];
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }: { type: PollType }) {
  if (type === "LEADERSHIP_ELECTION") {
    return (
      <span className="inline-flex items-center border border-gold-sovereign/40 bg-gold-sovereign/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-300">
        Leadership Election
      </span>
    );
  }
  return (
    <span className="inline-flex items-center border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sky-300">
      Kingdom Decision
    </span>
  );
}

export default function VotingPage() {
  const { status: authStatus, me } = useAuth();
  const [data, setData] = useState<PublicVotingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api<PublicVotingOverviewResponse>("/voting")
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(errorText(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authStatus]);

  const isAdmin =
    me?.user.role === "SUPER_ADMIN" || me?.user.role === "ADMIN";

  return (
    <div className="min-h-screen pb-24">
      {/* Header Banner */}
      <section className="relative isolate overflow-hidden border-b border-gold-sovereign/20 bg-obsidian-950/90 py-14 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_70%)]"
        />
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Sovereign Assembly of Dragonhold</p>
              <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.06em] text-parchment-100 sm:text-5xl">
                Kingdom Voting &amp; Royal Referendums
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-parchment-300 sm:text-base">
                Participate in Leadership Elections and Kingdom Decisions that
                shape the governance and realm laws of Dragonhold. Every active
                citizen holds one sealed vote per assembly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/voting/archive"
                className={cx(buttonStyles({ variant: "secondary", size: "md" }))}
              >
                Public Voting Archive
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/voting"
                  className={cx(buttonStyles({ variant: "primary", size: "md" }))}
                >
                  Admin Voting Controls
                </Link>
              )}
            </div>
          </div>

          {/* Citizen Authentication Banner */}
          <div className="mt-8 flex flex-col gap-3 border border-gold-sovereign/25 bg-obsidian-900/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            {authStatus === "authenticated" && me ? (
              <div className="flex flex-wrap items-center gap-3 text-xs text-parchment-200">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span>
                  Signed in as{" "}
                  <strong className="text-gold-300">
                    {me.citizen?.characterName ?? me.user.username}
                  </strong>
                  {me.citizen?.citizenCode && (
                    <span className="ml-2 font-mono text-[11px] text-parchment-400">
                      ({me.citizen.citizenCode})
                    </span>
                  )}
                </span>
                <span className="text-parchment-400">•</span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">
                  {!me.citizen?.status || me.citizen.status === "ACTIVE"
                    ? "Eligible to Vote"
                    : "Citizen Pass Inactive"}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                <p className="text-xs text-parchment-300">
                  Public visitors may inspect active assemblies and official
                  proclamations. Sign in with your Citizen Pass to cast a sealed
                  vote.
                </p>
                <Link
                  href="/login"
                  className={cx(buttonStyles({ variant: "secondary", size: "md" }))}
                >
                  Sign In to Vote
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-[1280px] space-y-14 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <Emblem className="h-12 w-12 animate-pulse" />
            <p className="font-display text-sm uppercase tracking-widest text-gold-300">
              Unsealing Royal Chamber Records…
            </p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="border border-[#c98070] bg-[#2a0f0c]/85 px-6 py-5 text-sm text-[#ffd8cf]"
          >
            {error}
          </div>
        ) : (
          <>
            {/* 1. Active Voting Sessions */}
            <section aria-labelledby="active-voting-heading">
              <div className="flex flex-col gap-2 border-b border-gold-sovereign/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Open for Citizen Participation</p>
                  <h2
                    id="active-voting-heading"
                    className="mt-1 font-display text-2xl uppercase tracking-[0.06em] text-parchment-100"
                  >
                    Active Voting Sessions
                  </h2>
                </div>
                <p className="font-mono text-xs uppercase tracking-wider text-parchment-400">
                  {data?.activePolls.length ?? 0} Active{" "}
                  {(data?.activePolls.length ?? 0) === 1
                    ? "Session"
                    : "Sessions"}
                </p>
              </div>

              {!data || data.activePolls.length === 0 ? (
                <div className="mt-6 border border-gold-sovereign/20 bg-obsidian-900/50 p-8 text-center">
                  <p className="font-display text-base uppercase tracking-wider text-parchment-200">
                    No Active Voting Sessions at This Hour
                  </p>
                  <p className="mt-2 text-sm text-parchment-400">
                    When the High Council opens a Leadership Election or Kingdom
                    Decision, eligible citizens will cast their ballots here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {data.activePolls.map((poll) => (
                    <article
                      key={poll.id}
                      className="plate-card flex flex-col justify-between p-6 sm:p-8"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <TypeBadge type={poll.type} />
                            <span className="inline-flex items-center border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                              Active Voting
                            </span>
                          </div>
                          {poll.hasVoted && (
                            <span className="inline-flex items-center border border-gold-sovereign/60 bg-gold-sovereign/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-200">
                              ✓ Vote Sealed
                            </span>
                          )}
                        </div>

                        <h3 className="mt-4 font-display text-xl uppercase tracking-wider text-parchment-100 sm:text-2xl">
                          <Link
                            href={`/voting/${poll.id}`}
                            className="hover:text-gold-300 transition-colors"
                          >
                            {poll.title}
                          </Link>
                        </h3>

                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-parchment-300">
                          {poll.description}
                        </p>

                        {/* Candidate / Option preview without vote counts */}
                        <div className="mt-5 border-t border-gold-sovereign/15 pt-4">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-gold-400">
                            {poll.type === "LEADERSHIP_ELECTION"
                              ? `${poll.options.length} Official Candidates`
                              : `${poll.options.length} Decision Options`}
                          </p>
                          <ul className="mt-2.5 space-y-1.5">
                            {poll.options.slice(0, 4).map((opt, idx) => (
                              <li
                                key={opt.id}
                                className="flex items-center gap-2.5 text-xs text-parchment-200"
                              >
                                <span className="font-mono text-[10px] text-gold-400">
                                  {idx + 1}.
                                </span>
                                <span className="font-medium">{opt.label}</span>
                                {opt.shortDescription && (
                                  <span className="truncate text-parchment-400">
                                    — {opt.shortDescription}
                                  </span>
                                )}
                              </li>
                            ))}
                            {poll.options.length > 4 && (
                              <li className="font-mono text-[11px] text-parchment-400">
                                + {poll.options.length - 4} more…
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-4 border-t border-gold-sovereign/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-[11px] text-parchment-400">
                          <p>
                            Opened:{" "}
                            <span className="text-parchment-200">
                              {formatDateTime(poll.openedAt)}
                            </span>
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                            Live tallies remain sealed while voting is active
                          </p>
                        </div>
                        <Link
                          href={`/voting/${poll.id}`}
                          className={cx(
                            buttonStyles({
                              variant: poll.hasVoted ? "secondary" : "primary",
                              size: "md",
                            }),
                          )}
                        >
                          {poll.hasVoted
                            ? "Inspect Ballot"
                            : "Enter Chamber & Vote"}
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Officially Published Results */}
            <section aria-labelledby="published-results-heading">
              <div className="flex flex-col gap-2 border-b border-gold-sovereign/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Royal Proclamations</p>
                  <h2
                    id="published-results-heading"
                    className="mt-1 font-display text-2xl uppercase tracking-[0.06em] text-parchment-100"
                  >
                    Official Result Announcements
                  </h2>
                </div>
                <Link
                  href="/voting/archive"
                  className="font-mono text-xs uppercase tracking-wider text-gold-300 hover:text-gold-200"
                >
                  Browse Full Archive →
                </Link>
              </div>

              {!data || data.publishedPolls.length === 0 ? (
                <div className="mt-6 border border-gold-sovereign/20 bg-obsidian-900/40 p-8 text-center">
                  <p className="text-sm text-parchment-300">
                    No active result announcements are currently pinned to the
                    proclamation board. You may inspect past decisions in the{" "}
                    <Link
                      href="/voting/archive"
                      className="text-gold-300 underline underline-offset-4 hover:text-gold-200"
                    >
                      Public Voting Archive
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {data.publishedPolls.map((poll) => (
                    <article
                      key={poll.id}
                      className="plate-card p-6 sm:p-8"
                    >
                      <div className="flex flex-col gap-3 border-b border-gold-sovereign/20 pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <TypeBadge type={poll.type} />
                            <span className="inline-flex items-center border border-gold-sovereign/50 bg-gold-sovereign/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-300">
                              Officially Published Result
                            </span>
                            {poll.hasVoted && (
                              <span className="inline-flex items-center border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                                You Participated
                              </span>
                            )}
                          </div>
                          <h3 className="mt-3 font-display text-2xl uppercase tracking-wider text-parchment-100">
                            <Link
                              href={`/voting/${poll.id}`}
                              className="hover:text-gold-300 transition-colors"
                            >
                              {poll.title}
                            </Link>
                          </h3>
                          <p className="mt-2 text-sm text-parchment-300">
                            {poll.description}
                          </p>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                            Total Verified Votes
                          </p>
                          <p className="font-display text-3xl text-gold-300">
                            {poll.results?.totalVotes ?? 0}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-parchment-400">
                            Announced:{" "}
                            {formatDateTime(poll.resultsPublishedAt)}
                          </p>
                        </div>
                      </div>

                      {poll.results && (
                        <div className="mt-5 space-y-3">
                          {poll.results.options.map((opt) => (
                            <div
                              key={opt.id}
                              className="border border-gold-sovereign/20 bg-obsidian-950/75 p-4"
                            >
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div>
                                  <span className="font-display text-base uppercase tracking-wider text-parchment-100">
                                    {opt.label}
                                  </span>
                                  {opt.shortDescription && (
                                    <p className="mt-0.5 text-xs text-parchment-300">
                                      {opt.shortDescription}
                                    </p>
                                  )}
                                </div>
                                <div className="font-mono text-xs text-gold-300">
                                  <strong>{opt.voteCount}</strong> votes (
                                  {opt.percentage.toFixed(1)}%)
                                </div>
                              </div>
                              <div className="mt-2.5 h-2 w-full overflow-hidden bg-obsidian-900">
                                <div
                                  className="h-full bg-gradient-to-r from-gold-500 to-gold-300"
                                  style={{
                                    width: `${Math.min(100, opt.percentage)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gold-sovereign/15 pt-4 text-xs text-parchment-400">
                        <span>
                          Voting Closed: {formatDateTime(poll.closedAt)}
                        </span>
                        <Link
                          href={`/voting/${poll.id}`}
                          className="font-mono uppercase tracking-wider text-gold-300 hover:text-gold-200"
                        >
                          View Full Decree &amp; Breakdown →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* 3. Closed Voting Sessions Awaiting Result Proclamation */}
            {data && data.closedPendingPolls.length > 0 && (
              <section aria-labelledby="closed-pending-heading">
                <div className="border-b border-gold-sovereign/20 pb-4">
                  <p className="eyebrow">Ballots Sealed</p>
                  <h2
                    id="closed-pending-heading"
                    className="mt-1 font-display text-2xl uppercase tracking-[0.06em] text-parchment-100"
                  >
                    Closed Voting — Awaiting Official Proclamation
                  </h2>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {data.closedPendingPolls.map((poll) => (
                    <article
                      key={poll.id}
                      className="border border-gold-sovereign/25 bg-obsidian-900/75 p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <TypeBadge type={poll.type} />
                        <span className="inline-flex items-center border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-200">
                          Closed • Results Sealed
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-xl uppercase tracking-wider text-parchment-100">
                        <Link
                          href={`/voting/${poll.id}`}
                          className="hover:text-gold-300 transition-colors"
                        >
                          {poll.title}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-parchment-300">
                        {poll.description}
                      </p>

                      <div className="mt-4 border border-amber-500/20 bg-obsidian-950/70 px-3.5 py-2.5 text-xs text-parchment-300">
                        Voting has ended. Official results have not yet been
                        announced by the High Council.
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-parchment-400">
                        <span>Closed: {formatDateTime(poll.closedAt)}</span>
                        <Link
                          href={`/voting/${poll.id}`}
                          className="font-mono uppercase tracking-wider text-gold-300 hover:text-gold-200"
                        >
                          Inspect Session →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}