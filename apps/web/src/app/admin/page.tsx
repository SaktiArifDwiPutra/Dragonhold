"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Emblem } from "@/components/emblem";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { api, errorText } from "@/lib/api";
import { cx } from "@/lib/cx";
import { useLanguage } from "@/lib/i18n";

type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalCitizens: number;
  activeSessions: number;
  activeSessionUsers: number;
  publishedAnnouncements: number;
  totalAnnouncements: number;
  totalAuditLogs: number;
};

type AuditActivityItem = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    role: "SUPER_ADMIN" | "ADMIN" | "CITIZEN";
  };
};

type AdminOverviewResponse = {
  stats: AdminStats;
  recentActivity: AuditActivityItem[];
};

type MonitoredUser = {
  id: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN" | "CITIZEN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  citizen: {
    id: string;
    citizenCode: string;
    characterName: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    joinedAt: string;
  } | null;
};

type AdminUsersResponse = {
  users: MonitoredUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function formatDateTime(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function RoleBadge({ role }: { role: "SUPER_ADMIN" | "ADMIN" | "CITIZEN" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        role === "SUPER_ADMIN"
          ? "border-gold-sovereign bg-gold-sovereign/15 text-gold-300"
          : role === "ADMIN"
            ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
            : "border-canvas-border bg-canvas-base text-stone-300",
      )}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: "ACTIVE" | "SUSPENDED" | "INACTIVE" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        status === "ACTIVE"
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
          : status === "SUSPENDED"
            ? "border-seal-crimson bg-seal-crimson/20 text-red-200"
            : "border-canvas-border bg-canvas-base text-stone-400",
      )}
    >
      {status}
    </span>
  );
}

export default function AdminDashboardPage() {
  const { status, me, logout } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();

  const isAdmin =
    status === "authenticated" &&
    (me?.user.role === "ADMIN" || me?.user.role === "SUPER_ADMIN");

  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [usersData, setUsersData] = useState<AdminUsersResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "SUPER_ADMIN" | "ADMIN" | "CITIZEN">("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "SUSPENDED">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await api<AdminOverviewResponse>("/admin/overview");
      setOverview(res);
    } catch (err) {
      setError(errorText(err, lang));
    } finally {
      setLoadingOverview(false);
    }
  }, [lang]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (appliedSearch) params.set("search", appliedSearch);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await api<AdminUsersResponse>(`/admin/users?${params.toString()}`);
      setUsersData(res);
    } catch (err) {
      setError(errorText(err, lang));
    } finally {
      setLoadingUsers(false);
    }
  }, [page, appliedSearch, roleFilter, statusFilter, lang]);

  useEffect(() => {
    if (!isAdmin) return;
    setError(null);
    void fetchOverview();
  }, [isAdmin, fetchOverview]);

  useEffect(() => {
    if (!isAdmin) return;
    setError(null);
    void fetchUsers();
  }, [isAdmin, fetchUsers]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  }

  function handleResetFilters() {
    setSearchInput("");
    setAppliedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  }

  function handleRefreshAll() {
    setError(null);
    void fetchOverview();
    void fetchUsers();
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
            {t.admin.restrictedBody}
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

  const stats = overview?.stats;
  const recentActivity = overview?.recentActivity ?? [];
  const usersList = usersData?.users ?? [];
  const pagination = usersData?.pagination;

  return (
    <div className="pb-16">
      {/* Header Banner */}
      <section className="border-b border-gold-sovereign/25 bg-canvas-surface">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-gold-400">
                  {t.admin.eyebrow}
                </span>
                <span className="text-stone-500">·</span>
                <RoleBadge role={me.user.role as "SUPER_ADMIN" | "ADMIN"} />
              </div>
              <h1 className="mt-2 font-display text-2xl tracking-wider text-parchment-50 sm:text-4xl">
                {t.admin.consoleTitle}
              </h1>
              <p className="mt-1 font-mono text-xs text-stone-400">
                {t.admin.signedInAs}{" "}
                <span className="text-parchment-200">{me.user.username}</span>
                {me.citizen?.citizenCode ? ` (${me.citizen.citizenCode})` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/admin/voting" className={buttonStyles()}>
                {t.admin.votingManagement}
              </Link>
              <Button
                variant="secondary"
                onClick={handleRefreshAll}
                disabled={loadingOverview || loadingUsers}
              >
                {loadingOverview || loadingUsers
                  ? t.common.refreshing
                  : t.common.refresh}
              </Button>
              <Link href="/dashboard" className={buttonStyles({ variant: "secondary" })}>
                {t.common.kingdomHall}
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
              className="border border-gold-sovereign bg-gold-sovereign/15 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-gold-300"
            >
              {t.admin.platformOverview}
            </Link>
            <Link
              href="/admin/voting"
              className="border border-canvas-border bg-canvas-base px-4 py-2 font-mono text-xs uppercase tracking-wider text-stone-300 transition-colors hover:border-gold-sovereign/60 hover:text-gold-300"
            >
              {t.admin.votingManagement}
            </Link>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-4 pt-8">
        {error ? <Alert>{error}</Alert> : null}

        {/* SECTION A: OVERVIEW STATISTICS */}
        <section aria-labelledby="stats-heading">
          <div className="flex items-center justify-between border-b border-canvas-border pb-3">
            <h2
              id="stats-heading"
              className="font-display text-base uppercase tracking-widest text-gold-300"
            >
              {t.admin.platformOverview}
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
              {t.admin.liveTelemetry}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Panel variant="hud" brackets className="p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                {t.admin.stats.registeredUsers}
              </p>
              <p className="mt-2 font-display text-3xl text-parchment-50">
                {stats ? stats.totalUsers : "—"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-stone-400">
                {stats
                  ? `${stats.activeUsers} active · ${stats.suspendedUsers} suspended`
                  : t.common.loading}
              </p>
            </Panel>

            <Panel variant="hud" brackets className="p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                {t.admin.stats.enlistedCitizens}
              </p>
              <p className="mt-2 font-display text-3xl text-gold-300">
                {stats ? stats.totalCitizens : "—"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-stone-400">
                {t.admin.stats.sealedRecords}
              </p>
            </Panel>

            <Panel variant="hud" brackets className="p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                {t.admin.stats.activeSessions}
              </p>
              <p className="mt-2 font-display text-3xl text-emerald-400">
                {stats ? stats.activeSessions : "—"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-stone-400">
                {stats ? `${stats.activeSessionUsers} active` : t.common.loading}
              </p>
            </Panel>

            <Panel variant="hud" brackets className="p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                {t.admin.stats.proclamations}
              </p>
              <p className="mt-2 font-display text-3xl text-parchment-50">
                {stats ? stats.publishedAnnouncements : "—"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-stone-400">
                {stats
                  ? `${stats.publishedAnnouncements} / ${stats.totalAnnouncements}`
                  : t.common.loading}
              </p>
            </Panel>

            <Panel variant="hud" brackets className="p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                {t.admin.stats.auditEvents}
              </p>
              <p className="mt-2 font-display text-3xl text-parchment-50">
                {stats ? stats.totalAuditLogs : "—"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-stone-400">
                {t.admin.stats.recordedActions}
              </p>
            </Panel>
          </div>
        </section>

        {/* SECTION B: USER & CITIZEN MONITORING */}
        <section aria-labelledby="users-heading">
          <div className="flex flex-col gap-2 border-b border-canvas-border pb-3 sm:flex-row sm:items-center sm:justify-between">
            <h2
              id="users-heading"
              className="font-display text-base uppercase tracking-widest text-gold-300"
            >
              {t.admin.usersHeading}
            </h2>
            <span className="font-mono text-xs text-stone-400">
              {pagination ? `${usersList.length} / ${pagination.total}` : t.common.loading}
            </span>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-4 grid grid-cols-1 gap-3 border border-canvas-border bg-canvas-surface p-4 sm:grid-cols-12"
          >
            <div className="sm:col-span-5">
              <label
                htmlFor="user-search"
                className="block font-mono text-[11px] uppercase tracking-wider text-stone-400"
              >
                {t.admin.searchLabel}
              </label>
              <input
                id="user-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.admin.searchPlaceholder}
                maxLength={64}
                className="mt-1 block min-h-11 w-full border-2 border-canvas-border bg-canvas-base px-3 py-2 text-sm text-parchment-50 placeholder:text-stone-500 focus:border-gold-sovereign focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="role-filter"
                className="block font-mono text-[11px] uppercase tracking-wider text-stone-400"
              >
                {t.admin.roleLabel}
              </label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as "" | "SUPER_ADMIN" | "ADMIN" | "CITIZEN");
                  setPage(1);
                }}
                className="mt-1 block min-h-11 w-full border-2 border-canvas-border bg-canvas-base px-3 py-2 text-sm text-parchment-50 focus:border-gold-sovereign focus:outline-none"
              >
                <option value="">{t.admin.allRoles}</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="CITIZEN">CITIZEN</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="status-filter"
                className="block font-mono text-[11px] uppercase tracking-wider text-stone-400"
              >
                {t.admin.statusLabel}
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "" | "ACTIVE" | "SUSPENDED");
                  setPage(1);
                }}
                className="mt-1 block min-h-11 w-full border-2 border-canvas-border bg-canvas-base px-3 py-2 text-sm text-parchment-50 focus:border-gold-sovereign focus:outline-none"
              >
                <option value="">{t.admin.allStatuses}</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div className="flex items-end gap-2 sm:col-span-3">
              <Button type="submit" className="flex-1">
                {t.admin.filterBtn}
              </Button>
              {(appliedSearch || roleFilter || statusFilter) ? (
                <Button type="button" variant="secondary" onClick={handleResetFilters}>
                  {t.admin.resetBtn}
                </Button>
              ) : null}
            </div>
          </form>

          <div className="mt-4 overflow-x-auto border border-canvas-border bg-canvas-surface">
            {loadingUsers && !usersData ? (
              <div className="p-8 text-center font-mono text-xs text-stone-400">
                {t.admin.loadingRegistry}
              </div>
            ) : usersList.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-display text-sm uppercase tracking-wider text-gold-300">
                  {t.admin.noMatchingUsers}
                </p>
                <p className="mt-1 font-serif text-sm text-stone-400">
                  {t.admin.noMatchingUsersBody}
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-canvas-border bg-canvas-base/70 font-mono text-[11px] uppercase tracking-wider text-stone-400">
                    <th className="px-4 py-3">{t.admin.tableHeaders.citizenId}</th>
                    <th className="px-4 py-3">{t.admin.tableHeaders.usernameChar}</th>
                    <th className="px-4 py-3">{t.admin.tableHeaders.role}</th>
                    <th className="px-4 py-3">{t.admin.tableHeaders.accountStatus}</th>
                    <th className="px-4 py-3">{t.admin.tableHeaders.registered}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-border">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-canvas-subtle/60">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gold-300">
                        {u.citizen?.citizenCode ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm font-medium text-parchment-50">
                          {u.username}
                        </p>
                        {u.citizen?.characterName && u.citizen.characterName !== u.username ? (
                          <p className="font-serif text-xs text-stone-400">
                            {u.citizen.characterName}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-400">
                        {formatDateShort(u.createdAt, t.localeCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="font-mono text-xs text-stone-400">
                {t.votingArchive.pageLabel} {pagination.page} {t.votingArchive.ofLabel}{" "}
                {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={pagination.page <= 1 || loadingUsers}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t.common.previous}
                </Button>
                <Button
                  variant="secondary"
                  disabled={pagination.page >= pagination.totalPages || loadingUsers}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t.common.next}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        {/* SECTION C: RECENT PLATFORM ACTIVITY */}
        <section aria-labelledby="activity-heading">
          <div className="flex items-center justify-between border-b border-canvas-border pb-3">
            <h2
              id="activity-heading"
              className="font-display text-base uppercase tracking-widest text-gold-300"
            >
              {t.admin.activityHeading}
            </h2>
            <span className="font-mono text-xs text-stone-400">{t.admin.auditLog}</span>
          </div>

          <div className="mt-4">
            {loadingOverview && !overview ? (
              <Panel className="text-center font-mono text-xs text-stone-400">
                {t.admin.loadingAudit}
              </Panel>
            ) : recentActivity.length === 0 ? (
              <Panel className="text-center">
                <p className="font-display text-sm uppercase tracking-wider text-gold-300">
                  {t.admin.noActivity}
                </p>
                <p className="mt-1 font-serif text-sm text-stone-400">
                  {t.admin.noActivityBody}
                </p>
              </Panel>
            ) : (
              <div className="overflow-x-auto border border-canvas-border bg-canvas-surface">
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-canvas-border bg-canvas-base/70 font-mono text-[11px] uppercase tracking-wider text-stone-400">
                      <th className="px-4 py-3">{t.admin.tableHeaders.action}</th>
                      <th className="px-4 py-3">{t.admin.tableHeaders.actor}</th>
                      <th className="px-4 py-3">{t.admin.tableHeaders.target}</th>
                      <th className="px-4 py-3">{t.admin.tableHeaders.timestamp}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-canvas-border">
                    {recentActivity.map((item) => (
                      <tr key={item.id} className="hover:bg-canvas-subtle/60">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gold-300">
                          {item.action}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-parchment-50">
                              {item.actor.username}
                            </span>
                            <RoleBadge role={item.actor.role} />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-stone-400">
                          {item.targetType
                            ? `${item.targetType}${item.targetId ? ` (${item.targetId.slice(0, 8)}…)` : ""}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-stone-400">
                          {formatDateTime(item.createdAt, t.localeCode)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
