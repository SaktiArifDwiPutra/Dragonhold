"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
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

export default function VotingDetailPage() {
  const params = useParams<{ id: string }>();
  const pollId = params?.id ?? "";
  const { status: authStatus, me } = useAuth();

  const [poll, setPoll] = useState<PublicPollCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [confirmingVote, setConfirmingVote] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccessMessage, setVoteSuccessMessage] = useState<string | null>(
    null,
  );

  const loadPoll = useCallback(async () => {
    if (!pollId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ poll: PublicPollCard }>(`/voting/${pollId}`);
      setPoll(res.poll);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    void loadPoll();
  }, [loadPoll, authStatus]);

  const isEligibleCitizen =
    authStatus === "authenticated" &&
    Boolean(me?.citizen?.id) &&
    (!me?.citizen?.status || me?.citizen?.status === "ACTIVE");

  const selectedOption =
    poll?.options.find((opt) => opt.id === selectedOptionId) ?? null;

  async function handleConfirmVote() {
    if (!poll || !selectedOptionId) return;
    setSubmittingVote(true);
    setVoteError(null);
    try {
      await api(`/voting/${poll.id}/vote`, {
        method: "POST",
        json: { optionId: selectedOptionId },
      });
      setConfirmingVote(false);
      setVoteSuccessMessage(
        "Your sealed vote has been recorded in the Royal Registry of Dragonhold. Once cast, a citizen's ballot is final and immutable.",
      );
      await loadPoll();
    } catch (err) {
      setVoteError(errorText(err));
      setConfirmingVote(false);
    } finally {
      setSubmittingVote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Emblem className="h-12 w-12 animate-pulse" />
        <p className="font-display text-sm uppercase tracking-widest text-gold-300">
          Opening Assembly Scroll…
        </p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="plate-card p-8 text-center">
          <p className="eyebrow">Chamber Notice</p>
          <h1 className="mt-2 font-display text-2xl uppercase tracking-wider text-parchment-100">
            Voting Session Unavailable
          </h1>
          <p className="mt-3 text-sm text-parchment-300">
            {error ?? "This voting session could not be found."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/voting"
              className={cx(buttonStyles({ variant: "secondary", size: "md" }))}
            >
              Return to Voting Hall
            </Link>
            <Link
              href="/voting/archive"
              className={cx(buttonStyles({ variant: "ghost", size: "md" }))}
            >
              Browse Archive
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isResultsVisible =
    poll.status === "CLOSED" &&
    (poll.resultsVisibility === "PUBLISHED" ||
      poll.resultsVisibility === "ARCHIVED") &&
    poll.results !== null;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <section className="relative isolate overflow-hidden border-b border-gold-sovereign/20 bg-obsidian-950/90 py-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_70%)]"
        />
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/voting"
              className="font-mono text-xs uppercase tracking-wider text-gold-300 hover:text-gold-200"
            >
              ← Return to Voting Hall
            </Link>
            <Link
              href="/voting/archive"
              className="font-mono text-xs uppercase tracking-wider text-parchment-300 hover:text-gold-300"
            >
              Public Voting Archive →
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {poll.type === "LEADERSHIP_ELECTION" ? (
              <span className="inline-flex items-center border border-gold-sovereign/40 bg-gold-sovereign/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-300">
                Leadership Election
              </span>
            ) : (
              <span className="inline-flex items-center border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sky-300">
                Kingdom Decision
              </span>
            )}

            {poll.status === "ACTIVE" && (
              <span className="inline-flex items-center border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                Active — Open for Citizen Votes
              </span>
            )}

            {poll.status === "CLOSED" &&
              poll.resultsVisibility === "HIDDEN" && (
                <span className="inline-flex items-center border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-200">
                  Voting Closed — Results Sealed
                </span>
              )}

            {poll.status === "CLOSED" &&
              poll.resultsVisibility === "PUBLISHED" && (
                <span className="inline-flex items-center border border-gold-sovereign/60 bg-gold-sovereign/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-200">
                  Officially Published Result
                </span>
              )}

            {poll.status === "CLOSED" &&
              poll.resultsVisibility === "ARCHIVED" && (
                <span className="inline-flex items-center border border-purple-400/40 bg-purple-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-purple-200">
                  Archived Official Record
                </span>
              )}

            {poll.status === "CANCELLED" && (
              <span className="inline-flex items-center border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rose-200">
                Cancelled Assembly
              </span>
            )}

            {poll.hasVoted && (
              <span className="inline-flex items-center border border-gold-sovereign/60 bg-gold-sovereign/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-200">
                ✓ Your Vote Is Sealed
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-3xl uppercase tracking-[0.06em] text-parchment-100 sm:text-5xl">
            {poll.title}
          </h1>

          <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-relaxed text-parchment-200 sm:text-base">
            {poll.description}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-gold-sovereign/20 pt-5 text-xs sm:grid-cols-4">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                Opened
              </dt>
              <dd className="mt-1 text-parchment-200">
                {formatDateTime(poll.openedAt)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                Closed
              </dt>
              <dd className="mt-1 text-parchment-200">
                {formatDateTime(poll.closedAt)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                Planned Window
              </dt>
              <dd className="mt-1 text-parchment-200">
                {poll.scheduledEndAt
                  ? `Until ${formatDateTime(poll.scheduledEndAt)}`
                  : "Manual Council Control"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                Result Proclamation
              </dt>
              <dd className="mt-1 text-parchment-200">
                {isResultsVisible
                  ? formatDateTime(poll.resultsPublishedAt)
                  : "Not Yet Announced"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-[1120px] space-y-10 px-4 sm:px-6 lg:px-8">
        {/* Status Banners */}
        {voteSuccessMessage && (
          <div
            role="status"
            className="border border-emerald-500/50 bg-emerald-950/70 px-6 py-5 text-sm text-emerald-100"
          >
            <p className="font-display text-base uppercase tracking-wider text-emerald-300">
              ✓ Royal Ballot Sealed
            </p>
            <p className="mt-1">{voteSuccessMessage}</p>
          </div>
        )}

        {voteError && (
          <div
            role="alert"
            className="border border-[#c98070] bg-[#2a0f0c]/85 px-6 py-4 text-sm text-[#ffd8cf]"
          >
            {voteError}
          </div>
        )}

        {poll.status === "CANCELLED" && (
          <div className="border border-rose-500/40 bg-rose-950/40 p-6">
            <h2 className="font-display text-lg uppercase tracking-wider text-rose-200">
              This Voting Session Was Cancelled
            </h2>
            <p className="mt-2 text-sm text-parchment-300">
              Cancelled on {formatDateTime(poll.cancelledAt)} by order of the
              High Council. No further ballots are accepted.
            </p>
          </div>
        )}

        {poll.status === "CLOSED" && poll.resultsVisibility === "HIDDEN" && (
          <div className="plate-card border-amber-500/40 p-6 sm:p-8">
            <p className="eyebrow text-amber-300">Ballot Box Sealed</p>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-wider text-parchment-100">
              Voting Has Ended — Official Results Pending Announcement
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-parchment-300">
              This voting session was closed on{" "}
              <strong className="text-parchment-100">
                {formatDateTime(poll.closedAt)}
              </strong>
              . In accordance with Dragonhold law, vote counts, percentages, and
              candidate rankings remain strictly confidential until the High
              Council officially publishes the proclamation.
            </p>
          </div>
        )}

        {/* Official Published / Archived Results Section */}
        {isResultsVisible && poll.results && (
          <section
            aria-labelledby="official-results-heading"
            className="plate-card p-6 sm:p-8"
          >
            <div className="flex flex-col gap-4 border-b border-gold-sovereign/25 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">
                  {poll.resultsVisibility === "ARCHIVED"
                    ? "Archived Royal Proclamation"
                    : "Official Royal Proclamation"}
                </p>
                <h2
                  id="official-results-heading"
                  className="mt-1 font-display text-2xl uppercase tracking-wider text-parchment-100 sm:text-3xl"
                >
                  Official Voting Results
                </h2>
                <p className="mt-1 text-xs text-parchment-400">
                  Announced on {formatDateTime(poll.resultsPublishedAt)}
                  {poll.resultsVisibility === "ARCHIVED" &&
                    ` • Archived in permanent record on ${formatDateTime(poll.resultsWithdrawnAt)}`}
                </p>
              </div>
              <div className="border border-gold-sovereign/30 bg-obsidian-950/80 px-5 py-3 text-left sm:text-right">
                <p className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                  Total Verified Ballots
                </p>
                <p className="font-display text-3xl text-gold-300">
                  {poll.results.totalVotes}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {poll.results.options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="border border-gold-sovereign/25 bg-obsidian-950/80 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      {opt.imageUrl && (
                        <img
                          src={opt.imageUrl}
                          alt={opt.label}
                          className="h-16 w-16 shrink-0 border border-gold-sovereign/40 object-cover"
                        />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-gold-400">
                            Option #{idx + 1}
                          </span>
                          <h3 className="font-display text-xl uppercase tracking-wider text-parchment-100">
                            {opt.label}
                          </h3>
                        </div>
                        {opt.shortDescription && (
                          <p className="mt-1 text-sm text-gold-200">
                            {opt.shortDescription}
                          </p>
                        )}
                        {opt.details && (
                          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-parchment-300">
                            {opt.details}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="font-display text-2xl text-gold-300">
                        {opt.percentage.toFixed(1)}%
                      </p>
                      <p className="font-mono text-xs text-parchment-300">
                        {opt.voteCount}{" "}
                        {opt.voteCount === 1 ? "vote" : "votes"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2.5 w-full overflow-hidden bg-obsidian-900">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 to-gold-300"
                      style={{ width: `${Math.min(100, opt.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Options / Ballot Selection Section (When Active or Closed-Hidden) */}
        {!isResultsVisible && (
          <section aria-labelledby="options-heading" className="space-y-6">
            <div className="flex flex-col gap-2 border-b border-gold-sovereign/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">
                  {poll.type === "LEADERSHIP_ELECTION"
                    ? "Official Slate of Candidates"
                    : "Proposed Kingdom Decisions"}
                </p>
                <h2
                  id="options-heading"
                  className="mt-1 font-display text-2xl uppercase tracking-wider text-parchment-100"
                >
                  {poll.status === "ACTIVE"
                    ? poll.hasVoted
                      ? "Ballot Options (Your Vote Is Sealed)"
                      : "Select One Option to Cast Your Sealed Vote"
                    : "Recorded Options on This Ballot"}
                </h2>
              </div>
              {poll.status === "ACTIVE" && (
                <p className="font-mono text-xs uppercase tracking-wider text-parchment-400">
                  Live vote counts are hidden during active voting
                </p>
              )}
            </div>

            {/* Citizen Eligibility / Login Notice when Active */}
            {poll.status === "ACTIVE" && !poll.hasVoted && (
              <>
                {authStatus !== "authenticated" && (
                  <div className="flex flex-col gap-4 border border-gold-sovereign/30 bg-obsidian-900/80 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-display text-sm uppercase tracking-wider text-gold-300">
                        Citizen Authentication Required to Submit a Vote
                      </p>
                      <p className="mt-1 text-xs text-parchment-300">
                        You may review the candidates and proposals below as a
                        visitor. Sign in with an active Citizen Pass to cast
                        your ballot.
                      </p>
                    </div>
                    <Link
                      href="/login"
                      className={cx(
                        buttonStyles({ variant: "primary", size: "md" }),
                      )}
                    >
                      Sign In to Vote
                    </Link>
                  </div>
                )}

                {authStatus === "authenticated" && !isEligibleCitizen && (
                  <div className="border border-amber-500/40 bg-amber-950/40 p-5 text-xs text-amber-200">
                    Only citizens with an <strong>ACTIVE</strong> Citizen Pass
                    are eligible to submit votes in Kingdom assemblies.
                  </div>
                )}
              </>
            )}

            <div className="grid gap-6">
              {poll.options.map((opt, idx) => {
                const canSelect =
                  poll.status === "ACTIVE" &&
                  isEligibleCitizen &&
                  !poll.hasVoted;
                const isSelected = selectedOptionId === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (canSelect) setSelectedOptionId(opt.id);
                    }}
                    className={cx(
                      "plate-card p-6 transition-all",
                      canSelect && "cursor-pointer hover:border-gold-sovereign/60",
                      isSelected &&
                        "border-gold-sovereign ring-1 ring-gold-sovereign/60 bg-obsidian-900/95",
                    )}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        {opt.imageUrl && (
                          <img
                            src={opt.imageUrl}
                            alt={opt.label}
                            className="h-20 w-20 shrink-0 border border-gold-sovereign/40 object-cover"
                          />
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="border border-gold-sovereign/30 bg-obsidian-950 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-400">
                              {poll.type === "LEADERSHIP_ELECTION"
                                ? `Candidate #${idx + 1}`
                                : `Option #${idx + 1}`}
                            </span>
                            <h3 className="font-display text-xl uppercase tracking-wider text-parchment-100 sm:text-2xl">
                              {opt.label}
                            </h3>
                          </div>

                          {opt.shortDescription && (
                            <p className="mt-2 font-medium text-sm text-gold-200">
                              {opt.shortDescription}
                            </p>
                          )}

                          {opt.details && (
                            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-parchment-300">
                              {opt.details}
                            </p>
                          )}
                        </div>
                      </div>

                      {canSelect && (
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOptionId(opt.id);
                            }}
                            className={cx(
                              "border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                              isSelected
                                ? "border-gold-sovereign bg-gold-sovereign text-obsidian-950 font-semibold"
                                : "border-gold-sovereign/40 bg-obsidian-950 text-gold-300 hover:border-gold-sovereign",
                            )}
                          >
                            {isSelected ? "✓ Selected" : "Select Option"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Vote Bar */}
            {poll.status === "ACTIVE" && isEligibleCitizen && !poll.hasVoted && (
              <div className="plate-card flex flex-col gap-4 border-gold-sovereign/40 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-base uppercase tracking-wider text-parchment-100">
                    {selectedOption
                      ? `Selected: ${selectedOption.label}`
                      : "No Option Selected Yet"}
                  </p>
                  <p className="mt-1 text-xs text-parchment-400">
                    Votes are final and cannot be modified or withdrawn once
                    submitted.
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={!selectedOptionId || submittingVote}
                  onClick={() => {
                    setVoteError(null);
                    setConfirmingVote(true);
                  }}
                >
                  Seal &amp; Submit Vote
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmingVote && selectedOption && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-vote-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="plate-card max-w-lg w-full p-6 sm:p-8">
            <p className="eyebrow">Final Ballot Confirmation</p>
            <h2
              id="confirm-vote-title"
              className="mt-2 font-display text-2xl uppercase tracking-wider text-parchment-100"
            >
              Seal Your Vote for Dragonhold?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-parchment-300">
              You are about to cast your official citizen vote in{" "}
              <strong className="text-parchment-100">{poll.title}</strong> for:
            </p>
            <div className="mt-4 border border-gold-sovereign/40 bg-obsidian-950 p-4">
              <p className="font-display text-lg uppercase tracking-wider text-gold-300">
                {selectedOption.label}
              </p>
              {selectedOption.shortDescription && (
                <p className="mt-1 text-xs text-parchment-300">
                  {selectedOption.shortDescription}
                </p>
              )}
            </div>
            <p className="mt-4 text-xs text-amber-200/90">
              Important: Each citizen may vote only once per session. Submitted
              votes cannot be altered or rescinded.
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={submittingVote}
                onClick={() => setConfirmingVote(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={submittingVote}
                onClick={handleConfirmVote}
              >
                {submittingVote ? "Sealing Ballot…" : "Confirm & Seal Vote"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}