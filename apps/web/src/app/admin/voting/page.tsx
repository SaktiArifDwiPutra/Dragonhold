"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Emblem } from "@/components/emblem";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { ApiError, api, errorText } from "@/lib/api";
import { cx } from "@/lib/cx";
import { useLanguage } from "@/lib/i18n";

type PollType = "LEADERSHIP_ELECTION" | "KINGDOM_DECISION";
type PollStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";
type PollResultsVisibility = "HIDDEN" | "PUBLISHED" | "ARCHIVED";
type FilterOption =
  | "ALL"
  | "DRAFT"
  | "ACTIVE"
  | "CLOSED"
  | "PUBLISHED"
  | "ARCHIVED";

type VotingOverviewStats = {
  totalPolls: number;
  draftPolls: number;
  activePolls: number;
  closedPolls: number;
  cancelledPolls: number;
  publishedResults: number;
  archivedResults: number;
  totalVotesCast: number;
};

type AdminPollSummary = {
  id: string;
  title: string;
  description: string;
  type: PollType;
  status: PollStatus;
  resultsVisibility: PollResultsVisibility;
  totalVotes: number;
  optionCount: number;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  openedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  resultsPublishedAt: string | null;
  resultsWithdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminPollOptionResult = {
  id: string;
  pollId: string;
  label: string;
  shortDescription: string;
  details: string;
  imageUrl: string | null;
  displayOrder: number;
  voteCount: number;
  percentage: number;
};

type PollAuditEntry = {
  id: string;
  pollId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    role: "SUPER_ADMIN" | "ADMIN" | "CITIZEN";
  };
};

type AdminPollDetail = {
  poll: Omit<AdminPollSummary, "optionCount">;
  options: AdminPollOptionResult[];
  auditHistory: PollAuditEntry[];
};

type AdminVotingListResponse = {
  stats: VotingOverviewStats;
  polls: AdminPollSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type LifecycleActionSpec = {
  action:
    | "open"
    | "close"
    | "publish-results"
    | "withdraw-results"
    | "republish-results"
    | "cancel";
  label: string;
  confirmTitle: string;
  confirmBody: string;
  variant?: "primary" | "secondary";
};

type OptionDraft = {
  label: string;
  shortDescription: string;
  details: string;
  imageUrl: string;
};

function formatDateTime(iso: string | null, locale: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PollTypeBadge({
  type,
  electionLabel,
  decisionLabel,
}: {
  type: PollType;
  electionLabel: string;
  decisionLabel: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        type === "LEADERSHIP_ELECTION"
          ? "border-gold-sovereign bg-gold-sovereign/15 text-gold-300"
          : "border-amber-500/50 bg-amber-500/10 text-amber-300",
      )}
    >
      {type === "LEADERSHIP_ELECTION" ? electionLabel : decisionLabel}
    </span>
  );
}

function PollStatusBadge({ status }: { status: PollStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        status === "ACTIVE"
          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
          : status === "DRAFT"
            ? "border-stone-500/50 bg-stone-500/10 text-stone-300"
            : status === "CLOSED"
              ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
              : "border-seal-crimson bg-seal-crimson/20 text-red-200",
      )}
    >
      {status}
    </span>
  );
}

function VisibilityBadge({ visibility }: { visibility: PollResultsVisibility }) {
  return (
    <span
      className={cx(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        visibility === "PUBLISHED"
          ? "border-gold-sovereign bg-gold-sovereign/20 text-gold-300"
          : visibility === "ARCHIVED"
            ? "border-[#8c6239] bg-canvas-base text-parchment-200"
            : "border-canvas-border bg-canvas-base text-stone-400",
      )}
    >
      {visibility}
    </span>
  );
}

export default function AdminVotingPage() {
  const { status, me, logout } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();

  const isAdmin =
    status === "authenticated" &&
    (me?.user.role === "ADMIN" || me?.user.role === "SUPER_ADMIN");

  const [listData, setListData] = useState<AdminVotingListResponse | null>(null);
  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminPollDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [pendingAction, setPendingAction] = useState<LifecycleActionSpec | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createType, setCreateType] = useState<PollType>("LEADERSHIP_ELECTION");
  const [createStartAt, setCreateStartAt] = useState("");
  const [createEndAt, setCreateEndAt] = useState("");
  const [createOptions, setCreateOptions] = useState<OptionDraft[]>([
    { label: "", shortDescription: "", details: "", imageUrl: "" },
    { label: "", shortDescription: "", details: "", imageUrl: "" },
  ]);
  const [creating, setSubmittingCreate] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams({
        filter,
        page: String(page),
        limit: "20",
      });
      const res = await api<AdminVotingListResponse>(
        `/admin/voting?${params.toString()}`,
      );
      setListData(res);
    } catch (err) {
      setError(errorText(err, lang));
    } finally {
      setLoadingList(false);
    }
  }, [filter, page, lang]);

  const fetchDetail = useCallback(
    async (pollId: string) => {
      setLoadingDetail(true);
      try {
        const res = await api<AdminPollDetail>(`/admin/voting/${pollId}`);
        setSelectedDetail(res);
      } catch (err) {
        setError(errorText(err, lang));
      } finally {
        setLoadingDetail(false);
      }
    },
    [lang],
  );

  useEffect(() => {
    if (!isAdmin) return;
    void fetchList();
  }, [isAdmin, fetchList]);

  useEffect(() => {
    if (!isAdmin || !selectedPollId) {
      setSelectedDetail(null);
      return;
    }
    void fetchDetail(selectedPollId);
  }, [isAdmin, selectedPollId, fetchDetail]);

  function addOptionField() {
    if (createOptions.length >= 12) return;
    setCreateOptions((prev) => [
      ...prev,
      { label: "", shortDescription: "", details: "", imageUrl: "" },
    ]);
  }

  function removeOptionField(index: number) {
    if (createOptions.length <= 2) return;
    setCreateOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOptionField(
    index: number,
    key: keyof OptionDraft,
    value: string,
  ) {
    setCreateOptions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmittingCreate(true);

    try {
      const payload = {
        title: createTitle,
        description: createDescription,
        type: createType,
        options: createOptions.map((o) => ({
          label: o.label,
          shortDescription: o.shortDescription,
          details: o.details,
          imageUrl: o.imageUrl.trim() || null,
        })),
        scheduledStartAt: createStartAt
          ? new Date(createStartAt).toISOString()
          : null,
        scheduledEndAt: createEndAt
          ? new Date(createEndAt).toISOString()
          : null,
      };

      const created = await api<AdminPollDetail>("/admin/voting", {
        method: "POST",
        json: payload,
      });

      setShowCreateForm(false);
      setCreateTitle("");
      setCreateDescription("");
      setCreateStartAt("");
      setCreateEndAt("");
      setCreateOptions([
        { label: "", shortDescription: "", details: "", imageUrl: "" },
        { label: "", shortDescription: "", details: "", imageUrl: "" },
      ]);
      setNotice(
        lang === "id"
          ? `Draf "${created.poll.title}" berhasil dibuat.`
          : `Draft "${created.poll.title}" has been created.`,
      );
      setSelectedPollId(created.poll.id);
      setSelectedDetail(created);
      await fetchList();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const flat = Object.values(err.details).flat().join(" ");
        setError(flat || errorText(err, lang));
      } else {
        setError(errorText(err, lang));
      }
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function executeLifecycleAction() {
    if (!selectedPollId || !pendingAction) return;
    setSubmittingAction(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await api<AdminPollDetail>(
        `/admin/voting/${selectedPollId}/${pendingAction.action}`,
        { method: "POST" },
      );
      setSelectedDetail(updated);
      setNotice(
        lang === "id"
          ? `Aksi "${pendingAction.label}" selesai untuk "${updated.poll.title}".`
          : `Action "${pendingAction.label}" completed for "${updated.poll.title}".`,
      );
      setPendingAction(null);
      await fetchList();
    } catch (err) {
      setError(errorText(err, lang));
      setPendingAction(null);
    } finally {
      setSubmittingAction(false);
    }
  }

  function getAvailableActions(poll: AdminPollDetail["poll"]): LifecycleActionSpec[] {
    const actions: LifecycleActionSpec[] = [];
    const a = t.admin.voting.actions;

    if (poll.status === "DRAFT") {
      actions.push({
        action: "open",
        ...a.open,
        variant: "primary",
      });
      actions.push({
        action: "cancel",
        ...a.cancel,
        variant: "secondary",
      });
    } else if (poll.status === "ACTIVE") {
      actions.push({
        action: "close",
        ...a.close,
        variant: "primary",
      });
      actions.push({
        action: "cancel",
        ...a.cancel,
        variant: "secondary",
      });
    } else if (poll.status === "CLOSED") {
      if (poll.resultsVisibility === "HIDDEN") {
        actions.push({
          action: "publish-results",
          ...a["publish-results"],
          variant: "primary",
        });
      } else if (poll.resultsVisibility === "PUBLISHED") {
        actions.push({
          action: "withdraw-results",
          ...a["withdraw-results"],
          variant: "secondary",
        });
      } else if (poll.resultsVisibility === "ARCHIVED") {
        actions.push({
          action: "republish-results",
          ...a["republish-results"],
          variant: "primary",
        });
      }
    }

    return actions;
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (status === "loading" || status === "anonymous") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Emblem className="h-12 w-12 animate-pulse" />
        <p className="font-display text-sm uppercase tracking-widest text-gold-300">
          {t.admin.verifying}
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Panel variant="hud" brackets className="space-y-4 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-seal-crimson">
            {t.admin.restrictedCode}
          </p>
          <h1 className="font-display text-2xl text-parchment-50">
            {t.admin.restrictedTitle}
          </h1>
          <p className="font-serif text-sm leading-relaxed text-stone-400">
            {t.admin.restrictedVotingBody}
          </p>
          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Link href="/dashboard" className={buttonStyles()}>
              {t.common.kingdomHall}
            </Link>
            <Link href="/" className={buttonStyles({ variant: "secondary" })}>
              {t.common.returnToRealm}
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  const stats = listData?.stats;
  const pollsList = listData?.polls ?? [];
  const pagination = listData?.pagination;
  const vt = t.admin.voting;

  return (
    <div className="pb-16">
      {/* Header Banner */}
      <section className="border-b border-gold-sovereign/25 bg-canvas-surface">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold-400">
                {vt.eyebrow}
              </p>
              <h1 className="mt-2 font-display text-2xl tracking-wider text-parchment-50 sm:text-4xl">
                {vt.title}
              </h1>
              <p className="mt-1 font-mono text-xs text-stone-400">{vt.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button onClick={() => setShowCreateForm((v) => !v)}>
                {showCreateForm ? vt.closeForm : vt.newDraft}
              </Button>
              <Link href="/voting" className={buttonStyles({ variant: "secondary" })}>
                {vt.publicView}
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                {t.common.signOut}
              </Button>
            </div>
          </div>

          <nav
            aria-label="Admin sections"
            className="mt-6 flex flex-wrap gap-2 border-t border-canvas-border pt-4"
          >
            <Link
              href="/admin"
              className="border border-canvas-border bg-canvas-base px-4 py-2 font-mono text-xs uppercase tracking-wider text-stone-300 transition-colors hover:border-gold-sovereign/60 hover:text-gold-300"
            >
              {t.admin.platformOverview}
            </Link>
            <Link
              href="/admin/voting"
              className="border border-gold-sovereign bg-gold-sovereign/15 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-gold-300"
            >
              {t.admin.votingManagement}
            </Link>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-4 pt-8">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {notice ? <Alert variant="info">{notice}</Alert> : null}

        {/* SECTION A: VOTING OVERVIEW STATISTICS */}
        <section aria-labelledby="voting-stats-heading">
          <div className="flex items-center justify-between border-b border-canvas-border pb-3">
            <h2
              id="voting-stats-heading"
              className="font-display text-base uppercase tracking-widest text-gold-300"
            >
              {vt.overviewHeading}
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
              {vt.telemetry}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              [vt.stats.total, stats?.totalPolls, "text-parchment-50"],
              [vt.stats.drafts, stats?.draftPolls, "text-stone-300"],
              [vt.stats.active, stats?.activePolls, "text-emerald-400"],
              [vt.stats.closed, stats?.closedPolls, "text-amber-300"],
              [vt.stats.published, stats?.publishedResults, "text-gold-300"],
              [vt.stats.archived, stats?.archivedResults, "text-parchment-200"],
              [vt.stats.totalVotes, stats?.totalVotesCast, "text-gold-400"],
            ].map(([label, val, color]) => (
              <Panel key={String(label)} variant="hud" brackets className="p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                  {label}
                </p>
                <p className={cx("mt-1.5 font-display text-2xl", String(color))}>
                  {val !== undefined ? val : "—"}
                </p>
              </Panel>
            ))}
          </div>
        </section>

        {/* SECTION C: CREATE VOTING FORM */}
        {showCreateForm ? (
          <section aria-labelledby="create-voting-heading">
            <Panel variant="hud" brackets className="space-y-6">
              <div className="flex items-center justify-between border-b border-canvas-border pb-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-gold-400">
                    {vt.createEyebrow}
                  </p>
                  <h2
                    id="create-voting-heading"
                    className="mt-1 font-display text-xl text-parchment-50"
                  >
                    {vt.createTitle}
                  </h2>
                </div>
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                  {t.common.cancel}
                </Button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-8">
                    <Field
                      label={vt.votingTitleLabel}
                      name="title"
                      required
                      placeholder={vt.votingTitlePlaceholder}
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="poll-type"
                      className="block text-sm font-medium text-parchment-200"
                    >
                      {vt.votingTypeLabel}
                    </label>
                    <select
                      id="poll-type"
                      value={createType}
                      onChange={(e) => setCreateType(e.target.value as PollType)}
                      className="mt-1.5 block min-h-12 w-full border-2 border-canvas-border bg-canvas-base px-3 py-2.5 text-sm text-parchment-50 focus:border-gold-sovereign focus:outline-none"
                    >
                      <option value="LEADERSHIP_ELECTION">{vt.electionOption}</option>
                      <option value="KINGDOM_DECISION">{vt.decisionOption}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="poll-description"
                    className="block text-sm font-medium text-parchment-200"
                  >
                    {vt.descriptionLabel}
                  </label>
                  <textarea
                    id="poll-description"
                    required
                    rows={4}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder={vt.descriptionPlaceholder}
                    className="mt-1.5 block w-full border-2 border-canvas-border bg-canvas-base px-4 py-2.5 text-sm text-parchment-50 placeholder:text-stone-500 focus:border-gold-sovereign focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={vt.startLabel}
                    type="datetime-local"
                    value={createStartAt}
                    onChange={(e) => setCreateStartAt(e.target.value)}
                    hint={vt.startHint}
                  />
                  <Field
                    label={vt.endLabel}
                    type="datetime-local"
                    value={createEndAt}
                    onChange={(e) => setCreateEndAt(e.target.value)}
                    hint={vt.endHint}
                  />
                </div>

                {/* Options / Candidates Builder */}
                <div className="space-y-4 border-t border-canvas-border pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base uppercase tracking-wider text-gold-300">
                        {createType === "LEADERSHIP_ELECTION"
                          ? vt.candidatesHeading
                          : vt.optionsHeading}
                      </h3>
                      <p className="text-xs text-stone-400">{vt.lockedNote}</p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addOptionField}
                      disabled={createOptions.length >= 12}
                    >
                      {createType === "LEADERSHIP_ELECTION"
                        ? vt.addCandidate
                        : vt.addOption}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {createOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className="space-y-3 border border-canvas-border bg-canvas-base p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold uppercase tracking-wider text-gold-400">
                            {createType === "LEADERSHIP_ELECTION"
                              ? `${t.votingDetail.candidateNumber}${idx + 1}`
                              : `${t.votingDetail.optionNumber}${idx + 1}`}
                          </span>
                          {createOptions.length > 2 ? (
                            <button
                              type="button"
                              onClick={() => removeOptionField(idx)}
                              className="font-mono text-xs uppercase text-red-300 hover:text-red-200"
                            >
                              {vt.remove}
                            </button>
                          ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label={
                              createType === "LEADERSHIP_ELECTION"
                                ? vt.candidateName
                                : vt.decisionOptionTitle
                            }
                            required
                            value={opt.label}
                            onChange={(e) =>
                              updateOptionField(idx, "label", e.target.value)
                            }
                            placeholder={
                              createType === "LEADERSHIP_ELECTION"
                                ? "e.g. Lady Seraphina Vance"
                                : "e.g. Fortify the Northern Citadel"
                            }
                          />
                          <Field
                            label={vt.shortSummary}
                            value={opt.shortDescription}
                            onChange={(e) =>
                              updateOptionField(idx, "shortDescription", e.target.value)
                            }
                            placeholder={vt.shortSummaryPlaceholder}
                          />
                        </div>

                        {createType === "LEADERSHIP_ELECTION" ? (
                          <Field
                            label={vt.imageUrlLabel}
                            value={opt.imageUrl}
                            onChange={(e) =>
                              updateOptionField(idx, "imageUrl", e.target.value)
                            }
                            placeholder="/images/hero-gates.jpg or https://..."
                          />
                        ) : null}

                        <div>
                          <label className="block text-xs font-medium text-parchment-200">
                            {createType === "LEADERSHIP_ELECTION"
                              ? vt.candidateBgLabel
                              : vt.decisionDetailsLabel}
                          </label>
                          <textarea
                            rows={2}
                            value={opt.details}
                            onChange={(e) =>
                              updateOptionField(idx, "details", e.target.value)
                            }
                            placeholder={vt.detailsPlaceholder}
                            className="mt-1 block w-full border-2 border-canvas-border bg-canvas-surface px-3 py-2 text-sm text-parchment-50 placeholder:text-stone-500 focus:border-gold-sovereign focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-canvas-border pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? vt.savingDraft : vt.saveAsDraft}
                  </Button>
                </div>
              </form>
            </Panel>
          </section>
        ) : null}

        {/* SECTION D: SELECTED VOTING DETAIL & LIFECYCLE CONTROLS */}
        {selectedPollId ? (
          <section aria-labelledby="detail-heading">
            <Panel variant="hud" brackets className="space-y-6">
              {loadingDetail || !selectedDetail ? (
                <p className="py-6 text-center font-mono text-xs text-stone-400">
                  {vt.loadingDetail}
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-4 border-b border-canvas-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <PollTypeBadge
                          type={selectedDetail.poll.type}
                          electionLabel={t.voting.typeElection}
                          decisionLabel={t.voting.typeDecision}
                        />
                        <PollStatusBadge status={selectedDetail.poll.status} />
                        <VisibilityBadge
                          visibility={selectedDetail.poll.resultsVisibility}
                        />
                      </div>
                      <h2
                        id="detail-heading"
                        className="font-display text-2xl text-parchment-50"
                      >
                        {selectedDetail.poll.title}
                      </h2>
                      <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-stone-300">
                        {selectedDetail.poll.description}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 font-mono text-xs text-stone-400">
                        <span>
                          {vt.stats.totalVotes}: {selectedDetail.poll.totalVotes}
                        </span>
                        <span>
                          {t.votingDetail.opened}:{" "}
                          {formatDateTime(selectedDetail.poll.openedAt, t.localeCode)}
                        </span>
                        <span>
                          {t.votingDetail.closed}:{" "}
                          {formatDateTime(selectedDetail.poll.closedAt, t.localeCode)}
                        </span>
                        <span>
                          {vt.stats.published}:{" "}
                          {formatDateTime(
                            selectedDetail.poll.resultsPublishedAt,
                            t.localeCode,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/voting/${selectedDetail.poll.id}`}
                        className={buttonStyles({ variant: "secondary" })}
                      >
                        {vt.viewPage}
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedPollId(null)}
                      >
                        {vt.closePanel}
                      </Button>
                    </div>
                  </div>

                  {/* Lifecycle Action Controls */}
                  <div className="space-y-3 border-b border-canvas-border pb-5">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-gold-400">
                      {vt.lifecycleHeading}
                    </h3>
                    {getAvailableActions(selectedDetail.poll).length === 0 ? (
                      <p className="font-mono text-xs text-stone-400">
                        {vt.noTransitions}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {getAvailableActions(selectedDetail.poll).map((spec) => (
                          <Button
                            key={spec.action}
                            variant={spec.variant ?? "primary"}
                            onClick={() => setPendingAction(spec)}
                            disabled={submittingAction}
                          >
                            {spec.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Confirmation Dialog */}
                    {pendingAction ? (
                      <div
                        role="alertdialog"
                        aria-labelledby="confirm-action-title"
                        className="mt-4 border-2 border-gold-sovereign bg-canvas-base p-5 shadow-2xl"
                      >
                        <p className="font-mono text-xs uppercase tracking-widest text-gold-400">
                          {vt.confirmActionEyebrow}
                        </p>
                        <h4
                          id="confirm-action-title"
                          className="mt-1 font-display text-lg text-parchment-50"
                        >
                          {pendingAction.confirmTitle}
                        </h4>
                        <p className="mt-2 font-serif text-sm leading-relaxed text-stone-300">
                          {pendingAction.confirmBody}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            onClick={executeLifecycleAction}
                            disabled={submittingAction}
                          >
                            {submittingAction
                              ? vt.executing
                              : `${vt.confirmPrefix} ${pendingAction.label}`}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setPendingAction(null)}
                            disabled={submittingAction}
                          >
                            {t.common.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Aggregate Vote Distribution */}
                  <div className="space-y-3 border-b border-canvas-border pb-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-xs uppercase tracking-widest text-gold-400">
                        {vt.tallyHeading}
                      </h3>
                      <span className="font-mono text-xs text-stone-400">
                        {vt.confidentialNote}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedDetail.options.map((opt) => (
                        <div
                          key={opt.id}
                          className="border border-canvas-border bg-canvas-base p-3.5"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <p className="font-display text-base text-parchment-50">
                                {opt.label}
                              </p>
                              {opt.shortDescription ? (
                                <p className="text-xs text-stone-400">
                                  {opt.shortDescription}
                                </p>
                              ) : null}
                            </div>
                            <div className="font-mono text-sm font-bold text-gold-300">
                              {opt.voteCount}{" "}
                              {opt.voteCount === 1
                                ? t.voting.voteSingular
                                : t.voting.votePlural}{" "}
                              ({opt.percentage.toFixed(1)}%)
                            </div>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden bg-canvas-surface">
                            <div
                              className="h-full bg-gold-sovereign transition-all"
                              style={{ width: `${Math.min(100, opt.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Poll Audit History */}
                  <div className="space-y-3">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-gold-400">
                      {vt.auditTrailHeading}
                    </h3>
                    {selectedDetail.auditHistory.length === 0 ? (
                      <p className="font-mono text-xs text-stone-400">
                        {vt.noAuditEvents}
                      </p>
                    ) : (
                      <ul className="divide-y divide-canvas-border border border-canvas-border bg-canvas-base text-xs">
                        {selectedDetail.auditHistory.map((entry) => (
                          <li
                            key={entry.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                          >
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-gold-300">
                                {entry.action}
                              </span>
                              <span className="text-stone-400">
                                {entry.actor.username} ({entry.actor.role})
                              </span>
                            </div>
                            <span className="font-mono text-stone-400">
                              {formatDateTime(entry.createdAt, t.localeCode)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </Panel>
          </section>
        ) : null}

        {/* SECTION B: VOTING MANAGEMENT LIST */}
        <section aria-labelledby="voting-list-heading">
          <div className="flex flex-col gap-3 border-b border-canvas-border pb-3 sm:flex-row sm:items-center sm:justify-between">
            <h2
              id="voting-list-heading"
              className="font-display text-base uppercase tracking-widest text-gold-300"
            >
              {vt.sessionsHeading}
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["ALL", vt.filters.ALL],
                  ["DRAFT", vt.filters.DRAFT],
                  ["ACTIVE", vt.filters.ACTIVE],
                  ["CLOSED", vt.filters.CLOSED],
                  ["PUBLISHED", vt.filters.PUBLISHED],
                  ["ARCHIVED", vt.filters.ARCHIVED],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFilter(key);
                    setPage(1);
                  }}
                  className={cx(
                    "border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                    filter === key
                      ? "border-gold-sovereign bg-gold-sovereign/20 font-bold text-gold-300"
                      : "border-canvas-border bg-canvas-surface text-stone-400 hover:border-gold-sovereign/50 hover:text-stone-200",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto border border-canvas-border bg-canvas-surface">
            {loadingList && !listData ? (
              <div className="p-8 text-center font-mono text-xs text-stone-400">
                {vt.loadingSessions}
              </div>
            ) : pollsList.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-display text-sm uppercase tracking-wider text-gold-300">
                  {vt.noSessionsTitle}
                </p>
                <p className="mt-1 font-serif text-sm text-stone-400">
                  {vt.noSessionsBody}
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-canvas-border bg-canvas-base/70 font-mono text-[11px] uppercase tracking-wider text-stone-400">
                    <th className="px-4 py-3">{vt.tableCols.title}</th>
                    <th className="px-4 py-3">{vt.tableCols.type}</th>
                    <th className="px-4 py-3">{vt.tableCols.status}</th>
                    <th className="px-4 py-3">{vt.tableCols.publication}</th>
                    <th className="px-4 py-3">{vt.tableCols.totalVotes}</th>
                    <th className="px-4 py-3">{vt.tableCols.created}</th>
                    <th className="px-4 py-3">{vt.tableCols.updated}</th>
                    <th className="px-4 py-3 text-right">{vt.tableCols.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-border">
                  {pollsList.map((poll) => (
                    <tr
                      key={poll.id}
                      className={cx(
                        "hover:bg-canvas-subtle/60",
                        selectedPollId === poll.id && "bg-gold-sovereign/5",
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-display text-sm text-parchment-50">
                          {poll.title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <PollTypeBadge
                          type={poll.type}
                          electionLabel={t.voting.typeElection}
                          decisionLabel={t.voting.typeDecision}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <PollStatusBadge status={poll.status} />
                      </td>
                      <td className="px-4 py-3">
                        <VisibilityBadge visibility={poll.resultsVisibility} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gold-300">
                        {poll.totalVotes}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-400">
                        {formatDateTime(poll.createdAt, t.localeCode)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-400">
                        {formatDateTime(poll.updatedAt, t.localeCode)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedPollId(poll.id)}
                        >
                          {vt.manageBtn}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="font-mono text-xs text-stone-400">
                {t.votingArchive.pageLabel} {pagination.page} {t.votingArchive.ofLabel}{" "}
                {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={pagination.page <= 1 || loadingList}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t.common.previous}
                </Button>
                <Button
                  variant="secondary"
                  disabled={pagination.page >= pagination.totalPages || loadingList}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t.common.next}
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}