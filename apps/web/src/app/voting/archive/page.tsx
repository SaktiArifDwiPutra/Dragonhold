"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Emblem } from "@/components/emblem";
import { Button, buttonStyles } from "@/components/ui/button";
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

type PublicArchiveResponse = {
  polls: PublicPollCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export default function VotingArchivePage() {
  const [typeFilter, setTypeFilter] = useState<"ALL" | PollType>("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PublicArchiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });
    if (typeFilter !== "ALL") {
      params.set("type", typeFilter);
    }

    api<PublicArchiveResponse>(`/voting/archive?${params.toString()}`)
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
  }, [typeFilter, page]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <section className="relative isolate overflow-hidden border-b border-gold-sovereign/20 bg-obsidian-950/90 py-14 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_70%)]"
        />
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Permanent Chronicles of the Realm</p>
              <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.06em] text-parchment-100 sm:text-5xl">
                Public Voting Archive
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-parchment-300 sm:text-base">
                The permanent historical record of all officially published and
                archived Leadership Elections and Kingdom Decisions in
                Dragonhold.
              </p>
            </div>
            <div>
              <Link
                href="/voting"
                className={cx(buttonStyles({ variant: "secondary", size: "md" }))}
              >
                ← Back to Active Voting Hall
              </Link>
            </div>
          </div>

          {/* Type Filter Tabs */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {(
              [
                { key: "ALL", label: "All Historical Records" },
                {
                  key: "LEADERSHIP_ELECTION",
                  label: "Leadership Elections",
                },
                { key: "KINGDOM_DECISION", label: "Kingdom Decisions" },
              ] as const
            ).map((tab) => {
              const active = typeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setTypeFilter(tab.key);
                    setPage(1);
                  }}
                  className={cx(
                    "border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                    active
                      ? "border-gold-sovereign bg-gold-sovereign/20 text-gold-200"
                      : "border-gold-sovereign/25 bg-obsidian-900/70 text-parchment-300 hover:border-gold-sovereign/50 hover:text-parchment-100",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <Emblem className="h-12 w-12 animate-pulse" />
            <p className="font-display text-sm uppercase tracking-widest text-gold-300">
              Consulting Historical Scrolls…
            </p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="border border-[#c98070] bg-[#2a0f0c]/85 px-6 py-5 text-sm text-[#ffd8cf]"
          >
            {error}
          </div>
        ) : !data || data.polls.length === 0 ? (
          <div className="plate-card p-10 text-center">
            <p className="font-display text-lg uppercase tracking-wider text-parchment-200">
              No Archived Voting Records Found
            </p>
            <p className="mt-2 text-sm text-parchment-400">
              Once a voting session is closed and its results are officially
              published by an administrator, its complete vote distribution is
              preserved here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {data.polls.map((poll) => (
              <article key={poll.id} className="plate-card p-6 sm:p-8">
                <div className="flex flex-col gap-4 border-b border-gold-sovereign/20 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {poll.type === "LEADERSHIP_ELECTION" ? (
                        <span className="inline-flex items-center border border-gold-sovereign/40 bg-gold-sovereign/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-300">
                          Leadership Election
                        </span>
                      ) : (
                        <span className="inline-flex items-center border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sky-300">
                          Kingdom Decision
                        </span>
                      )}

                      {poll.resultsVisibility === "PUBLISHED" ? (
                        <span className="inline-flex items-center border border-gold-sovereign/60 bg-gold-sovereign/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-200">
                          Published Announcement
                        </span>
                      ) : (
                        <span className="inline-flex items-center border border-purple-400/40 bg-purple-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-purple-200">
                          Archived Record
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 font-display text-2xl uppercase tracking-wider text-parchment-100">
                      <Link
                        href={`/voting/${poll.id}`}
                        className="hover:text-gold-300 transition-colors"
                      >
                        {poll.title}
                      </Link>
                    </h2>

                    <p className="mt-2 text-sm text-parchment-300">
                      {poll.description}
                    </p>
                  </div>

                  <div className="shrink-0 border border-gold-sovereign/25 bg-obsidian-950/75 px-5 py-3 text-left lg:text-right">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                      Total Votes Recorded
                    </p>
                    <p className="font-display text-3xl text-gold-300">
                      {poll.results?.totalVotes ?? 0}
                    </p>
                  </div>
                </div>

                {/* Metadata row */}
                <dl className="mt-4 grid grid-cols-1 gap-3 border-b border-gold-sovereign/15 pb-4 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                      Voting Period
                    </dt>
                    <dd className="mt-0.5 text-parchment-200">
                      {formatDateTime(poll.openedAt)} →{" "}
                      {formatDateTime(poll.closedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                      Announcement Date
                    </dt>
                    <dd className="mt-0.5 text-parchment-200">
                      {formatDateTime(poll.resultsPublishedAt)}
                    </dd>
                  </div>
                  <div className="sm:text-right">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                      Full Chronicle
                    </dt>
                    <dd className="mt-0.5">
                      <Link
                        href={`/voting/${poll.id}`}
                        className="font-mono uppercase tracking-wider text-gold-300 hover:text-gold-200"
                      >
                        Open Detailed Record →
                      </Link>
                    </dd>
                  </div>
                </dl>

                {/* Full Vote Distribution */}
                {poll.results && (
                  <div className="mt-5 space-y-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-gold-400">
                      Official Vote Distribution
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {poll.results.options.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className="border border-gold-sovereign/20 bg-obsidian-950/75 p-4"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display text-sm uppercase tracking-wider text-parchment-100">
                              {idx + 1}. {opt.label}
                            </span>
                            <span className="font-mono text-xs text-gold-300">
                              {opt.voteCount} votes ({opt.percentage.toFixed(1)}
                              %)
                            </span>
                          </div>
                          {opt.shortDescription && (
                            <p className="mt-1 text-xs text-parchment-400">
                              {opt.shortDescription}
                            </p>
                          )}
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
                  </div>
                )}
              </article>
            ))}

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gold-sovereign/20 pt-6">
                <p className="font-mono text-xs text-parchment-400">
                  Page {data.pagination.page} of {data.pagination.totalPages} (
                  {data.pagination.total} records)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="md"
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    size="md"
                    variant="secondary"
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}