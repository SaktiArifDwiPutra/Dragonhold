import {
  auditLogs,
  citizens,
  pollAuditLogs,
  pollOptions,
  polls,
  pollVotes,
  users,
  type Database,
} from "@dragonhold/db";
import type {
  CreatePollInput,
  PollResultsVisibility,
  PollStatus,
  PollType,
} from "@dragonhold/shared";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { HttpError } from "./errors";

export type VotingOverviewStats = {
  totalPolls: number;
  draftPolls: number;
  activePolls: number;
  closedPolls: number;
  cancelledPolls: number;
  publishedResults: number;
  archivedResults: number;
  totalVotesCast: number;
};

export type AdminPollSummary = {
  id: string;
  title: string;
  description: string;
  type: PollType;
  status: PollStatus;
  resultsVisibility: PollResultsVisibility;
  totalVotes: number;
  optionCount: number;
  scheduledStartAt: Date | string | null;
  scheduledEndAt: Date | string | null;
  openedAt: Date | string | null;
  closedAt: Date | string | null;
  cancelledAt: Date | string | null;
  resultsPublishedAt: Date | string | null;
  resultsWithdrawnAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type AdminPollOptionResult = {
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

export type PollAuditEntry = {
  id: string;
  pollId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string;
  actor: {
    id: string;
    username: string;
    role: "SUPER_ADMIN" | "ADMIN" | "CITIZEN";
  };
};

export type AdminPollDetail = {
  poll: Omit<AdminPollSummary, "optionCount">;
  options: AdminPollOptionResult[];
  auditHistory: PollAuditEntry[];
};

export type PublicPollOptionSafe = {
  id: string;
  label: string;
  shortDescription: string;
  details: string;
  imageUrl: string | null;
  displayOrder: number;
};

export type PublicPollOptionWithResult = PublicPollOptionSafe & {
  voteCount: number;
  percentage: number;
};

export type PublicPollCard = {
  id: string;
  title: string;
  description: string;
  type: PollType;
  status: PollStatus;
  resultsVisibility: PollResultsVisibility;
  scheduledStartAt: Date | string | null;
  scheduledEndAt: Date | string | null;
  openedAt: Date | string | null;
  closedAt: Date | string | null;
  cancelledAt: Date | string | null;
  resultsPublishedAt: Date | string | null;
  resultsWithdrawnAt: Date | string | null;
  createdAt: Date | string;
  hasVoted: boolean;
  options: PublicPollOptionSafe[];
  results: {
    totalVotes: number;
    options: PublicPollOptionWithResult[];
  } | null;
};

export type LifecycleAction =
  | "open"
  | "close"
  | "publish-results"
  | "withdraw-results"
  | "republish-results"
  | "cancel";

export interface VotingRepository {
  getAdminOverviewAndList(params: {
    filter:
      | "ALL"
      | "DRAFT"
      | "ACTIVE"
      | "CLOSED"
      | "PUBLISHED"
      | "ARCHIVED"
      | "CANCELLED";
    page: number;
    limit: number;
  }): Promise<{
    stats: VotingOverviewStats;
    polls: AdminPollSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;

  createPoll(
    actorUserId: string,
    input: CreatePollInput,
  ): Promise<AdminPollDetail>;

  getAdminPollDetail(pollId: string): Promise<AdminPollDetail>;

  transitionLifecycle(
    pollId: string,
    actorUserId: string,
    action: LifecycleAction,
  ): Promise<AdminPollDetail>;

  getPublicVotingOverview(citizenId: string | null): Promise<{
    activePolls: PublicPollCard[];
    publishedPolls: PublicPollCard[];
    closedPendingPolls: PublicPollCard[];
    cancelledPolls: PublicPollCard[];
  }>;

  getPublicPollById(
    pollId: string,
    citizenId: string | null,
  ): Promise<PublicPollCard>;

  getPublicArchive(params: {
    page: number;
    limit: number;
    type?: PollType;
    citizenId: string | null;
  }): Promise<{
    polls: PublicPollCard[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;

  castVote(params: {
    pollId: string;
    optionId: string;
    citizenId: string;
  }): Promise<{
    voteId: string;
    pollId: string;
    optionId: string;
    createdAt: Date | string;
  }>;
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export function computePercentage(voteCount: number, totalVotes: number): number {
  if (totalVotes <= 0 || voteCount <= 0) return 0;
  return Math.round((voteCount / totalVotes) * 1000) / 10;
}

export function isResultsPubliclyVisible(poll: {
  status: PollStatus;
  resultsVisibility: PollResultsVisibility;
}): boolean {
  return (
    poll.status === "CLOSED" &&
    (poll.resultsVisibility === "PUBLISHED" ||
      poll.resultsVisibility === "ARCHIVED")
  );
}

export function getVotingRepository(db: Database): VotingRepository {
  const maybeCustom = (db as unknown as { __votingRepo?: VotingRepository })
    .__votingRepo;
  if (maybeCustom) {
    return maybeCustom;
  }
  return createDrizzleVotingRepository(db);
}

export function createDrizzleVotingRepository(db: Database): VotingRepository {
  async function getAdminPollDetailInternal(
    executor: Database,
    pollId: string,
  ): Promise<AdminPollDetail> {
    const [pollRow] = await executor
      .select()
      .from(polls)
      .where(eq(polls.id, pollId))
      .limit(1);

    if (!pollRow) {
      throw new HttpError(
        404,
        "NOT_FOUND",
        "Sesi pemungutan suara tidak ditemukan.",
      );
    }

    const optionRows = await executor
      .select({
        id: pollOptions.id,
        pollId: pollOptions.pollId,
        label: pollOptions.label,
        shortDescription: pollOptions.shortDescription,
        details: pollOptions.details,
        imageUrl: pollOptions.imageUrl,
        displayOrder: pollOptions.displayOrder,
        voteCount: sql<number>`(
          SELECT count(*)::int FROM poll_votes
          WHERE poll_votes.option_id = "poll_options"."id"
        )`,
      })
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId))
      .orderBy(asc(pollOptions.displayOrder), asc(pollOptions.createdAt));

    const totalVotes = optionRows.reduce(
      (sum, opt) => sum + Number(opt.voteCount ?? 0),
      0,
    );

    const options: AdminPollOptionResult[] = optionRows.map((opt) => {
      const count = Number(opt.voteCount ?? 0);
      return {
        id: opt.id,
        pollId: opt.pollId,
        label: opt.label,
        shortDescription: opt.shortDescription,
        details: opt.details,
        imageUrl: opt.imageUrl ?? null,
        displayOrder: opt.displayOrder,
        voteCount: count,
        percentage: computePercentage(count, totalVotes),
      };
    });

    const auditRows = await executor
      .select({
        id: pollAuditLogs.id,
        pollId: pollAuditLogs.pollId,
        action: pollAuditLogs.action,
        metadata: pollAuditLogs.metadata,
        createdAt: pollAuditLogs.createdAt,
        actorId: users.id,
        actorUsername: users.username,
        actorRole: users.role,
      })
      .from(pollAuditLogs)
      .innerJoin(users, eq(users.id, pollAuditLogs.actorUserId))
      .where(eq(pollAuditLogs.pollId, pollId))
      .orderBy(desc(pollAuditLogs.createdAt))
      .limit(50);

    const auditHistory: PollAuditEntry[] = auditRows.map((row) => ({
      id: row.id,
      pollId: row.pollId,
      action: row.action,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt,
      actor: {
        id: row.actorId,
        username: row.actorUsername,
        role: row.actorRole,
      },
    }));

    return {
      poll: {
        id: pollRow.id,
        title: pollRow.title,
        description: pollRow.description,
        type: pollRow.type,
        status: pollRow.status,
        resultsVisibility: pollRow.resultsVisibility,
        totalVotes,
        scheduledStartAt: pollRow.scheduledStartAt,
        scheduledEndAt: pollRow.scheduledEndAt,
        openedAt: pollRow.openedAt,
        closedAt: pollRow.closedAt,
        cancelledAt: pollRow.cancelledAt,
        resultsPublishedAt: pollRow.resultsPublishedAt,
        resultsWithdrawnAt: pollRow.resultsWithdrawnAt,
        createdAt: pollRow.createdAt,
        updatedAt: pollRow.updatedAt,
      },
      options,
      auditHistory,
    };
  }

  async function hydratePublicPollCards(
    pollRows: Array<typeof polls.$inferSelect>,
    citizenId: string | null,
  ): Promise<PublicPollCard[]> {
    if (pollRows.length === 0) return [];

    const pollIds = pollRows.map((p) => p.id);

    // Fetch all options for these polls in a single query
    const allOptions = await db
      .select({
        id: pollOptions.id,
        pollId: pollOptions.pollId,
        label: pollOptions.label,
        shortDescription: pollOptions.shortDescription,
        details: pollOptions.details,
        imageUrl: pollOptions.imageUrl,
        displayOrder: pollOptions.displayOrder,
        voteCount: sql<number>`(
          SELECT count(*)::int FROM poll_votes
          WHERE poll_votes.option_id = "poll_options"."id"
        )`,
      })
      .from(pollOptions)
      .where(inArray(pollOptions.pollId, pollIds))
      .orderBy(asc(pollOptions.displayOrder), asc(pollOptions.createdAt));

    // If citizen is authenticated, check which of these polls they have voted on in a single query
    const votedPollIds = new Set<string>();
    if (citizenId) {
      const citizenVotes = await db
        .select({ pollId: pollVotes.pollId })
        .from(pollVotes)
        .where(
          and(
            eq(pollVotes.citizenId, citizenId),
            inArray(pollVotes.pollId, pollIds),
          ),
        );
      for (const v of citizenVotes) {
        votedPollIds.add(v.pollId);
      }
    }

    const optionsByPoll = new Map<string, typeof allOptions>();
    for (const opt of allOptions) {
      const list = optionsByPoll.get(opt.pollId) ?? [];
      list.push(opt);
      optionsByPoll.set(opt.pollId, list);
    }

    return pollRows.map((pollRow) => {
      const rawOpts = optionsByPoll.get(pollRow.id) ?? [];
      const safeOptions: PublicPollOptionSafe[] = rawOpts.map((opt) => ({
        id: opt.id,
        label: opt.label,
        shortDescription: opt.shortDescription,
        details: opt.details,
        imageUrl: opt.imageUrl ?? null,
        displayOrder: opt.displayOrder,
      }));

      // CRITICAL SECURITY REQUIREMENT:
      // Never compute or attach vote counts/percentages unless the poll is CLOSED
      // and resultsVisibility is PUBLISHED or ARCHIVED.
      const showResults = isResultsPubliclyVisible(pollRow);
      let results: PublicPollCard["results"] = null;

      if (showResults) {
        const totalVotes = rawOpts.reduce(
          (sum, o) => sum + Number(o.voteCount ?? 0),
          0,
        );
        results = {
          totalVotes,
          options: rawOpts.map((o) => {
            const count = Number(o.voteCount ?? 0);
            return {
              id: o.id,
              label: o.label,
              shortDescription: o.shortDescription,
              details: o.details,
              imageUrl: o.imageUrl ?? null,
              displayOrder: o.displayOrder,
              voteCount: count,
              percentage: computePercentage(count, totalVotes),
            };
          }),
        };
      }

      return {
        id: pollRow.id,
        title: pollRow.title,
        description: pollRow.description,
        type: pollRow.type,
        status: pollRow.status,
        resultsVisibility: pollRow.resultsVisibility,
        scheduledStartAt: pollRow.scheduledStartAt,
        scheduledEndAt: pollRow.scheduledEndAt,
        openedAt: pollRow.openedAt,
        closedAt: pollRow.closedAt,
        cancelledAt: pollRow.cancelledAt,
        resultsPublishedAt: pollRow.resultsPublishedAt,
        resultsWithdrawnAt: pollRow.resultsWithdrawnAt,
        createdAt: pollRow.createdAt,
        hasVoted: votedPollIds.has(pollRow.id),
        options: safeOptions,
        results,
      };
    });
  }

  return {
    async getAdminOverviewAndList({ filter, page, limit }) {
      const countRows = (await db.execute(sql`
        SELECT
          (SELECT count(*)::int FROM polls) AS "totalPolls",
          (SELECT count(*)::int FROM polls WHERE status = 'DRAFT') AS "draftPolls",
          (SELECT count(*)::int FROM polls WHERE status = 'ACTIVE') AS "activePolls",
          (SELECT count(*)::int FROM polls WHERE status = 'CLOSED') AS "closedPolls",
          (SELECT count(*)::int FROM polls WHERE status = 'CANCELLED') AS "cancelledPolls",
          (SELECT count(*)::int FROM polls WHERE results_visibility = 'PUBLISHED') AS "publishedResults",
          (SELECT count(*)::int FROM polls WHERE results_visibility = 'ARCHIVED') AS "archivedResults",
          (SELECT count(*)::int FROM poll_votes) AS "totalVotesCast"
      `)) as unknown as Array<Record<string, number | string>>;

      const raw = countRows[0] ?? {};
      const stats: VotingOverviewStats = {
        totalPolls: Number(raw.totalPolls ?? 0),
        draftPolls: Number(raw.draftPolls ?? 0),
        activePolls: Number(raw.activePolls ?? 0),
        closedPolls: Number(raw.closedPolls ?? 0),
        cancelledPolls: Number(raw.cancelledPolls ?? 0),
        publishedResults: Number(raw.publishedResults ?? 0),
        archivedResults: Number(raw.archivedResults ?? 0),
        totalVotesCast: Number(raw.totalVotesCast ?? 0),
      };

      const whereCondition =
        filter === "DRAFT"
          ? eq(polls.status, "DRAFT")
          : filter === "ACTIVE"
            ? eq(polls.status, "ACTIVE")
            : filter === "CLOSED"
              ? eq(polls.status, "CLOSED")
              : filter === "CANCELLED"
                ? eq(polls.status, "CANCELLED")
                : filter === "PUBLISHED"
                  ? eq(polls.resultsVisibility, "PUBLISHED")
                  : filter === "ARCHIVED"
                    ? eq(polls.resultsVisibility, "ARCHIVED")
                    : undefined;

      const [totalRow] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(polls)
        .where(whereCondition);

      const total = Number(totalRow?.total ?? 0);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const offset = (page - 1) * limit;

      const rows = await db
        .select({
          id: polls.id,
          title: polls.title,
          description: polls.description,
          type: polls.type,
          status: polls.status,
          resultsVisibility: polls.resultsVisibility,
          scheduledStartAt: polls.scheduledStartAt,
          scheduledEndAt: polls.scheduledEndAt,
          openedAt: polls.openedAt,
          closedAt: polls.closedAt,
          cancelledAt: polls.cancelledAt,
          resultsPublishedAt: polls.resultsPublishedAt,
          resultsWithdrawnAt: polls.resultsWithdrawnAt,
          createdAt: polls.createdAt,
          updatedAt: polls.updatedAt,
          totalVotes: sql<number>`(
            SELECT count(*)::int FROM poll_votes
            WHERE poll_votes.poll_id = "polls"."id"
          )`,
          optionCount: sql<number>`(
            SELECT count(*)::int FROM poll_options
            WHERE poll_options.poll_id = "polls"."id"
          )`,
        })
        .from(polls)
        .where(whereCondition)
        .orderBy(desc(polls.createdAt))
        .limit(limit)
        .offset(offset);

      const items: AdminPollSummary[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.type,
        status: r.status,
        resultsVisibility: r.resultsVisibility,
        totalVotes: Number(r.totalVotes ?? 0),
        optionCount: Number(r.optionCount ?? 0),
        scheduledStartAt: r.scheduledStartAt,
        scheduledEndAt: r.scheduledEndAt,
        openedAt: r.openedAt,
        closedAt: r.closedAt,
        cancelledAt: r.cancelledAt,
        resultsPublishedAt: r.resultsPublishedAt,
        resultsWithdrawnAt: r.resultsWithdrawnAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

      return {
        stats,
        polls: items,
        pagination: { page, limit, total, totalPages },
      };
    },

    async createPoll(actorUserId, input) {
      const createdId = await db.transaction(async (tx) => {
        const [createdPoll] = await tx
          .insert(polls)
          .values({
            title: input.title,
            description: input.description,
            type: input.type,
            status: "DRAFT",
            resultsVisibility: "HIDDEN",
            scheduledStartAt: input.scheduledStartAt
              ? new Date(input.scheduledStartAt)
              : null,
            scheduledEndAt: input.scheduledEndAt
              ? new Date(input.scheduledEndAt)
              : null,
            createdBy: actorUserId,
          })
          .returning({ id: polls.id });

        const pollId = createdPoll!.id;

        await tx.insert(pollOptions).values(
          input.options.map((opt, idx) => ({
            pollId,
            label: opt.label,
            shortDescription: opt.shortDescription ?? "",
            details: opt.details ?? "",
            imageUrl: opt.imageUrl ?? null,
            displayOrder: idx,
          })),
        );

        await tx.insert(pollAuditLogs).values({
          pollId,
          actorUserId,
          action: "poll.create",
          metadata: {
            type: input.type,
            optionCount: input.options.length,
          },
        });

        await tx.insert(auditLogs).values({
          actorUserId,
          action: "poll.create",
          targetType: "poll",
          targetId: pollId,
          metadata: {
            title: input.title,
            type: input.type,
            optionCount: input.options.length,
          },
        });

        return pollId;
      });

      return getAdminPollDetailInternal(db, createdId);
    },

    async getAdminPollDetail(pollId) {
      return getAdminPollDetailInternal(db, pollId);
    },

    async transitionLifecycle(pollId, actorUserId, action) {
      await db.transaction(async (tx) => {
        const [poll] = await tx
          .select()
          .from(polls)
          .where(eq(polls.id, pollId))
          .limit(1);

        if (!poll) {
          throw new HttpError(
            404,
            "NOT_FOUND",
            "Sesi pemungutan suara tidak ditemukan.",
          );
        }

        const now = new Date();
        let auditAction = "";
        let updateValues: Partial<typeof polls.$inferInsert> = {};

        if (action === "open") {
          if (poll.status !== "DRAFT") {
            throw new HttpError(
              400,
              "INVALID_POLL_TRANSITION",
              "Hanya pemungutan suara berstatus DRAFT yang dapat dibuka.",
            );
          }

          const [optCountRow] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(pollOptions)
            .where(eq(pollOptions.pollId, pollId));

          if (Number(optCountRow?.count ?? 0) < 2) {
            throw new HttpError(
              400,
              "INVALID_POLL_TRANSITION",
              "Pemungutan suara harus memiliki minimal 2 pilihan sebelum dibuka.",
            );
          }

          updateValues = {
            status: "ACTIVE",
            openedAt: now,
            openedBy: actorUserId,
            updatedAt: now,
          };
          auditAction = "poll.open";
        } else if (action === "close") {
          if (poll.status !== "ACTIVE") {
            throw new HttpError(
              400,
              "INVALID_POLL_TRANSITION",
              "Hanya pemungutan suara berstatus ACTIVE yang dapat ditutup.",
            );
          }

          // Closing does NOT publish results automatically
          updateValues = {
            status: "CLOSED",
            closedAt: now,
            closedBy: actorUserId,
            updatedAt: now,
          };
          auditAction = "poll.close";
        } else if (action === "publish-results") {
          if (poll.status !== "CLOSED") {
            throw new HttpError(
              400,
              "INVALID_POLL_TRANSITION",
              "Hasil hanya dapat dipublikasikan setelah pemungutan suara ditutup (CLOSED).",
            );
          }
          if (poll.resultsVisibility !== "HIDDEN") {
            throw new HttpError(
              400,
              "INVALID_POLL_TRANSITION",
              "Hasil pemungutan suara ini sudah pernah dipublikasikan.",
            );
          }

          updateValues = {
            resultsVisibility: "PUBLISHED",
            resultsPublishedAt: now,
            publishedBy: actorUserId,
            updatedAt: now,
          };
          auditAction = "poll.results_publish";
        } else if (action === "withdraw-results") {
          if (
            poll.status !== "CLOSED" ||
            poll.resultsVisibility !== "PUBLISHED"
          ) {
            throw new HttpError(
              400,
              "INVALID_POLL_TRANSITION",
              "Hanya pengumuman hasil yang sedang PUBLISHED yang dapat ditarik ke arsip.",
            );
          }

          // Withdrawing moves resultsVisibility to ARCHIVED without deleting votes or reopening
          updateValues = {
            resultsVisibility: "ARCHIVED",
            resultsWithdrawnAt: now,
            withdrawnBy: actorUserId,
            updatedAt: now,
          };
          auditAction = "poll.results_withdraw";
        } else if (action === "republish-results") {
          if (
            poll.status !== "CLOSED" ||
            poll.resultsVisibility !== "ARCHIVED"
          ) {
            throw new HttpError(
              400,
              "INVALID_POLL_TRANSITION",
              "Hanya hasil berstatus ARCHIVED yang dapat dipublikasikan kembali.",
            );
          }

          updateValues = {
            resultsVisibility: "PUBLISHED",
            resultsPublishedAt: now,
            publishedBy: actorUserId,
            updatedAt: now,
          };
          auditAction = "poll.results_republish";
        } else if (action === "cancel") {
          if (poll.status !== "DRAFT" && poll.status !== "ACTIVE") {
            throw new HttpError(
              400,
              "INVALID_POLL_TRANSITION",
              "Pemungutan suara yang sudah selesai (CLOSED) atau dibatalkan tidak dapat dibatalkan.",
            );
          }

          updateValues = {
            status: "CANCELLED",
            resultsVisibility: "HIDDEN",
            cancelledAt: now,
            cancelledBy: actorUserId,
            updatedAt: now,
          };
          auditAction = "poll.cancel";
        }

        await tx.update(polls).set(updateValues).where(eq(polls.id, pollId));

        await tx.insert(pollAuditLogs).values({
          pollId,
          actorUserId,
          action: auditAction,
          metadata: {
            previousStatus: poll.status,
            previousVisibility: poll.resultsVisibility,
          },
        });

        await tx.insert(auditLogs).values({
          actorUserId,
          action: auditAction,
          targetType: "poll",
          targetId: pollId,
          metadata: {
            title: poll.title,
            previousStatus: poll.status,
            previousVisibility: poll.resultsVisibility,
          },
        });
      });

      return getAdminPollDetailInternal(db, pollId);
    },

    async getPublicVotingOverview(citizenId) {
      // Fetch public-facing polls (never DRAFT, and not ARCHIVED since archived live in /voting/archive)
      const rows = await db
        .select()
        .from(polls)
        .where(inArray(polls.status, ["ACTIVE", "CLOSED", "CANCELLED"]))
        .orderBy(desc(polls.openedAt), desc(polls.createdAt))
        .limit(50);

      const visibleRows = rows.filter((r) => {
        if (r.status === "CANCELLED" && !r.openedAt) {
          // Cancelled drafts that were never opened to the public stay hidden
          return false;
        }
        if (r.status === "CLOSED" && r.resultsVisibility === "ARCHIVED") {
          // Archived results live in /voting/archive, not the active overview
          return false;
        }
        return true;
      });

      const cards = await hydratePublicPollCards(visibleRows, citizenId);

      return {
        activePolls: cards.filter((c) => c.status === "ACTIVE"),
        publishedPolls: cards.filter(
          (c) => c.status === "CLOSED" && c.resultsVisibility === "PUBLISHED",
        ),
        closedPendingPolls: cards.filter(
          (c) => c.status === "CLOSED" && c.resultsVisibility === "HIDDEN",
        ),
        cancelledPolls: cards.filter((c) => c.status === "CANCELLED"),
      };
    },

    async getPublicPollById(pollId, citizenId) {
      const [pollRow] = await db
        .select()
        .from(polls)
        .where(eq(polls.id, pollId))
        .limit(1);

      if (
        !pollRow ||
        pollRow.status === "DRAFT" ||
        (pollRow.status === "CANCELLED" && !pollRow.openedAt)
      ) {
        throw new HttpError(
          404,
          "NOT_FOUND",
          "Sesi pemungutan suara tidak ditemukan.",
        );
      }

      const [card] = await hydratePublicPollCards([pollRow], citizenId);
      return card!;
    },

    async getPublicArchive({ page, limit, type, citizenId }) {
      const conditions = [
        eq(polls.status, "CLOSED"),
        inArray(polls.resultsVisibility, ["PUBLISHED", "ARCHIVED"]),
      ];
      if (type) {
        conditions.push(eq(polls.type, type));
      }

      const whereClause = and(...conditions);

      const [countRow] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(polls)
        .where(whereClause);

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const offset = (page - 1) * limit;

      const rows = await db
        .select()
        .from(polls)
        .where(whereClause)
        .orderBy(desc(polls.resultsPublishedAt), desc(polls.closedAt))
        .limit(limit)
        .offset(offset);

      const cards = await hydratePublicPollCards(rows, citizenId);

      return {
        polls: cards,
        pagination: { page, limit, total, totalPages },
      };
    },

    async castVote({ pollId, optionId, citizenId }) {
      return db.transaction(async (tx) => {
        // 1. Verify citizen eligibility (must exist and be ACTIVE)
        const [citizen] = await tx
          .select({ id: citizens.id, status: citizens.status })
          .from(citizens)
          .where(eq(citizens.id, citizenId))
          .limit(1);

        if (!citizen || citizen.status !== "ACTIVE") {
          throw new HttpError(
            403,
            "CITIZEN_INELIGIBLE",
            "Hanya warga negara berstatus ACTIVE yang berhak memberikan suara.",
          );
        }

        // 2. Verify poll exists and is ACTIVE
        const [poll] = await tx
          .select({ id: polls.id, status: polls.status })
          .from(polls)
          .where(eq(polls.id, pollId))
          .limit(1);

        if (!poll) {
          throw new HttpError(
            404,
            "NOT_FOUND",
            "Sesi pemungutan suara tidak ditemukan.",
          );
        }

        if (poll.status !== "ACTIVE") {
          throw new HttpError(
            403,
            "VOTING_NOT_ACTIVE",
            "Pemungutan suara belum dibuka, sudah ditutup, atau tidak aktif.",
          );
        }

        // 3. Verify selected option belongs to this specific poll
        const [option] = await tx
          .select({ id: pollOptions.id, pollId: pollOptions.pollId })
          .from(pollOptions)
          .where(
            and(
              eq(pollOptions.id, optionId),
              eq(pollOptions.pollId, pollId),
            ),
          )
          .limit(1);

        if (!option) {
          throw new HttpError(
            400,
            "INVALID_OPTION",
            "Pilihan tidak valid untuk sesi pemungutan suara ini.",
          );
        }

        // 4. Insert vote (protected by UNIQUE (poll_id, citizen_id))
        try {
          const [inserted] = await tx
            .insert(pollVotes)
            .values({
              pollId,
              optionId,
              citizenId,
            })
            .returning({
              voteId: pollVotes.id,
              pollId: pollVotes.pollId,
              optionId: pollVotes.optionId,
              createdAt: pollVotes.createdAt,
            });

          return inserted!;
        } catch (err) {
          if (isUniqueViolation(err)) {
            throw new HttpError(
              409,
              "ALREADY_VOTED",
              "Kamu sudah memberikan suara pada pemungutan suara ini.",
            );
          }
          throw err;
        }
      });
    },
  };
}
