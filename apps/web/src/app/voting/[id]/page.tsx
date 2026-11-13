"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Emblem } from "@/components/emblem";
import { Button, buttonStyles } from "@/components/ui/button";
import { api, errorText } from "@/lib/api";
import { cx } from "@/lib/cx";
import { useLanguage } from "@/lib/i18n";

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

function formatDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale, {
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
  const { lang, t } = useLanguage();

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
      setError(errorText(err, lang));
    } finally {
      setLoading(false);
    }
  }, [pollId, lang]);

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
      setVoteSuccessMessage(t.votingDetail.voteRecordedMsg);
      await loadPoll();
    } catch (err) {
      setVoteError(errorText(err, lang));
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
          {t.votingDetail.loading}
        </p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="plate-card p-8 text-center">
          <p className="eyebrow">{t.votingDetail.unavailableEyebrow}</p>
          <h1 className="mt-2 font-display text-2xl uppercase tracking-wider text-parchment-100">
            {t.votingDetail.unavailableTitle}
          </h1>
          <p className="mt-3 text-sm text-parchment-300">
            {error ?? t.votingDetail.unavailableDefault}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/voting"
              className={cx(buttonStyles({ variant: "secondary", size: "md" }))}
            >
              {t.votingDetail.returnToHall}
            </Link>
            <Link
              href="/voting/archive"
              className={cx(buttonStyles({ variant: "ghost", size: "md" }))}
            >
              {t.votingDetail.browseArchive}
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
              {t.votingDetail.backToHall}
            </Link>
            <Link
              href="/voting/archive"
              className="font-mono text-xs uppercase tracking-wider text-parchment-300 hover:text-gold-300"
            >
              {t.votingDetail.publicArchive}
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {poll.type === "LEADERSHIP_ELECTION" ? (
              <span className="inline-flex items-center border border-gold-sovereign/40 bg-gold-sovereign/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-300">
                {t.voting.typeElection}
              </span>
            ) : (
              <span className="inline-flex items-center border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sky-300">
                {t.voting.typeDecision}
              </span>
            )}

            {poll.status === "ACTIVE" && (
              <span className="inline-flex items-center border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                {t.votingDetail.activeStatusBadge}
              </span>
            )}

            {poll.status === "CLOSED" &&
              poll.resultsVisibility === "HIDDEN" && (
                <span className="inline-flex items-center border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-200">
                  {t.votingDetail.closedHiddenBadge}
                </span>
              )}

            {poll.status === "CLOSED" &&
              poll.resultsVisibility === "PUBLISHED" && (
                <span className="inline-flex items-center border border-gold-sovereign/60 bg-gold-sovereign/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-200">
                  {t.votingDetail.publishedBadge}
                </span>
              )}

            {poll.status === "CLOSED" &&
              poll.resultsVisibility === "ARCHIVED" && (
                <span className="inline-flex items-center border border-purple-400/40 bg-purple-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-purple-200">
                  {t.votingDetail.archivedBadge}
                </span>
              )}

            {poll.status === "CANCELLED" && (
              <span className="inline-flex items-center border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rose-200">
                {t.votingDetail.cancelledBadge}
              </span>
            )}

            {poll.hasVoted && (
              <span className="inline-flex items-center border border-gold-sovereign/60 bg-gold-sovereign/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-200">
                {t.votingDetail.yourVoteSealed}
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
                {t.votingDetail.opened}
              </dt>
              <dd className="mt-1 text-parchment-200">
                {formatDateTime(poll.openedAt, t.localeCode)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                {t.votingDetail.closed}
              </dt>
              <dd className="mt-1 text-parchment-200">
                {formatDateTime(poll.closedAt, t.localeCode)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                {t.votingDetail.plannedWindow}
              </dt>
              <dd className="mt-1 text-parchment-200">
                {poll.scheduledEndAt
                  ? `${t.votingDetail.until} ${formatDateTime(poll.scheduledEndAt, t.localeCode)}`
                  : t.votingDetail.manualControl}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                {t.votingDetail.resultProclamation}
              </dt>
              <dd className="mt-1 text-parchment-200">
                {isResultsVisible
                  ? formatDateTime(poll.resultsPublishedAt, t.localeCode)
                  : t.votingDetail.notAnnounced}
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
              {t.votingDetail.ballotSealedTitle}
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
              {t.votingDetail.cancelledTitle}
            </h2>
            <p className="mt-2 text-sm text-parchment-300">
              {t.votingDetail.cancelledBodyPrefix}{" "}
              {formatDateTime(poll.cancelledAt, t.localeCode)}{" "}
              {t.votingDetail.cancelledBodySuffix}
            </p>
          </div>
        )}

        {poll.status === "CLOSED" && poll.resultsVisibility === "HIDDEN" && (
          <div className="plate-card border-amber-500/40 p-6 sm:p-8">
            <p className="eyebrow text-amber-300">
              {t.votingDetail.ballotBoxSealedEyebrow}
            </p>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-wider text-parchment-100">
              {t.votingDetail.ballotBoxSealedTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-parchment-300">
              {t.votingDetail.ballotBoxSealedBody1}{" "}
              <strong className="text-parchment-100">
                {formatDateTime(poll.closedAt, t.localeCode)}
              </strong>
              {t.votingDetail.ballotBoxSealedBody2}
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
                    ? t.votingDetail.archivedProclamationEyebrow
                    : t.votingDetail.officialProclamationEyebrow}
                </p>
                <h2
                  id="official-results-heading"
                  className="mt-1 font-display text-2xl uppercase tracking-wider text-parchment-100 sm:text-3xl"
                >
                  {t.votingDetail.officialResultsTitle}
                </h2>
                <p className="mt-1 text-xs text-parchment-400">
                  {t.votingDetail.announcedOn}{" "}
                  {formatDateTime(poll.resultsPublishedAt, t.localeCode)}
                  {poll.resultsVisibility === "ARCHIVED" &&
                    ` • ${t.votingDetail.archivedOn} ${formatDateTime(poll.resultsWithdrawnAt, t.localeCode)}`}
                </p>
              </div>
              <div className="border border-gold-sovereign/30 bg-obsidian-950/80 px-5 py-3 text-left sm:text-right">
                <p className="font-mono text-[10px] uppercase tracking-wider text-parchment-400">
                  {t.votingDetail.totalVerifiedBallots}
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
                            {t.votingDetail.optionNumber}
                            {idx + 1}
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
                        {opt.voteCount === 1
                          ? t.voting.voteSingular
                          : t.voting.votePlural}
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
                    ? t.votingDetail.officialSlate
                    : t.votingDetail.proposedDecisions}
                </p>
                <h2
                  id="options-heading"
                  className="mt-1 font-display text-2xl uppercase tracking-wider text-parchment-100"
                >
                  {poll.status === "ACTIVE"
                    ? poll.hasVoted
                      ? t.votingDetail.ballotOptionsSealed
                      : t.votingDetail.selectOneOption
                    : t.votingDetail.recordedOptions}
                </h2>
              </div>
              {poll.status === "ACTIVE" && (
                <p className="font-mono text-xs uppercase tracking-wider text-parchment-400">
                  {t.votingDetail.liveCountsHidden}
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
                        {t.votingDetail.authRequiredTitle}
                      </p>
                      <p className="mt-1 text-xs text-parchment-300">
                        {t.votingDetail.authRequiredBody}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link
                        href="/register"
                        className={cx(
                          buttonStyles({ variant: "primary", size: "md" }),
                        )}
                      >
                        {t.votingDetail.becomeCitizen}
                      </Link>
                      <Link
                        href="/login"
                        className={cx(
                          buttonStyles({ variant: "secondary", size: "md" }),
                        )}
                      >
                        {t.votingDetail.signInToVote}
                      </Link>
                    </div>
                  </div>
                )}

                {authStatus === "authenticated" && !isEligibleCitizen && (
                  <div className="border border-amber-500/40 bg-amber-950/40 p-5 text-xs text-amber-200">
                    {t.votingDetail.ineligibleNotice}
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
                                ? `${t.votingDetail.candidateNumber}${idx + 1}`
                                : `${t.votingDetail.optionNumber}${idx + 1}`}
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
                            {isSelected
                              ? t.votingDetail.selectedBtn
                              : t.votingDetail.selectOptionBtn}
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
                      ? `${t.votingDetail.selectedPrefix} ${selectedOption.label}`
                      : t.votingDetail.noOptionSelected}
                  </p>
                  <p className="mt-1 text-xs text-parchment-400">
                    {t.votingDetail.finalVoteNote}
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
                  {t.votingDetail.sealAndSubmit}
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
            <p className="eyebrow">{t.votingDetail.modalEyebrow}</p>
            <h2
              id="confirm-vote-title"
              className="mt-2 font-display text-2xl uppercase tracking-wider text-parchment-100"
            >
              {t.votingDetail.modalTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-parchment-300">
              {t.votingDetail.modalIntro}{" "}
              <strong className="text-parchment-100">{poll.title}</strong>{" "}
              {t.votingDetail.modalFor}
            </p>
            <div className="mt-4 flex items-center gap-3 border border-gold-sovereign/40 bg-obsidian-950 p-4">
              {selectedOption.imageUrl && (
                <img
                  src={selectedOption.imageUrl}
                  alt={selectedOption.label}
                  className="h-12 w-12 shrink-0 border border-gold-sovereign/40 object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="font-display text-lg uppercase tracking-wider text-gold-300">
                  {selectedOption.label}
                </p>
                {selectedOption.shortDescription && (
                  <p className="mt-1 text-xs text-parchment-300">
                    {selectedOption.shortDescription}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-amber-200/90">
              {t.votingDetail.modalWarning}
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={submittingVote}
                onClick={() => setConfirmingVote(false)}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={submittingVote}
                onClick={handleConfirmVote}
              >
                {submittingVote
                  ? t.votingDetail.sealingBallot
                  : t.votingDetail.confirmAndSeal}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}