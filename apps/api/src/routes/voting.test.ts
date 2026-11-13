import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type {
  CreatePollInput,
  PollResultsVisibility,
  PollStatus,
  PollType,
} from "@dragonhold/shared";
import { createApp } from "../app";
import { HttpError } from "../lib/errors";
import { hashToken } from "../lib/session";
import {
  computePercentage,
  isResultsPubliclyVisible,
  type AdminPollDetail,
  type AdminPollOptionResult,
  type AdminPollSummary,
  type LifecycleAction,
  type PollAuditEntry,
  type PublicPollCard,
  type VotingOverviewStats,
  type VotingRepository,
} from "../lib/voting-store";
import type { AppConfig } from "../types";

type TestActor = {
  token: string;
  tokenHash: string;
  userId: string;
  username: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "CITIZEN";
  userStatus: "ACTIVE" | "SUSPENDED";
  citizenId: string | null;
  citizenCode: string | null;
  characterName: string | null;
  citizenStatus: "ACTIVE" | "SUSPENDED" | "EXILED" | null;
};

const ACTORS: Record<string, TestActor> = {
  superAdmin: {
    token: "tok-super-admin-voting-test",
    tokenHash: hashToken("tok-super-admin-voting-test"),
    userId: "00000000-0000-4000-8000-000000000001",
    username: "archdragon",
    email: "archdragon@dragonhold.realm",
    role: "SUPER_ADMIN",
    userStatus: "ACTIVE",
    citizenId: "10000000-0000-4000-8000-000000000001",
    citizenCode: "DH-000001",
    characterName: "Archdragon Sovereign",
    citizenStatus: "ACTIVE",
  },
  admin: {
    token: "tok-admin-voting-test",
    tokenHash: hashToken("tok-admin-voting-test"),
    userId: "00000000-0000-4000-8000-000000000002",
    username: "high_chancellor",
    email: "chancellor@dragonhold.realm",
    role: "ADMIN",
    userStatus: "ACTIVE",
    citizenId: "10000000-0000-4000-8000-000000000002",
    citizenCode: "DH-000002",
    characterName: "High Chancellor",
    citizenStatus: "ACTIVE",
  },
  citizenOne: {
    token: "tok-citizen-one-voting-test",
    tokenHash: hashToken("tok-citizen-one-voting-test"),
    userId: "00000000-0000-4000-8000-000000000003",
    username: "aedan_vance",
    email: "aedan@dragonhold.realm",
    role: "CITIZEN",
    userStatus: "ACTIVE",
    citizenId: "10000000-0000-4000-8000-000000000003",
    citizenCode: "DH-000003",
    characterName: "Aedan Vance",
    citizenStatus: "ACTIVE",
  },
  citizenTwo: {
    token: "tok-citizen-two-voting-test",
    tokenHash: hashToken("tok-citizen-two-voting-test"),
    userId: "00000000-0000-4000-8000-000000000004",
    username: "lyra_ashborne",
    email: "lyra@dragonhold.realm",
    role: "CITIZEN",
    userStatus: "ACTIVE",
    citizenId: "10000000-0000-4000-8000-000000000004",
    citizenCode: "DH-000004",
    characterName: "Lyra Ashborne",
    citizenStatus: "ACTIVE",
  },
  suspendedCitizen: {
    token: "tok-suspended-citizen-voting-test",
    tokenHash: hashToken("tok-suspended-citizen-voting-test"),
    userId: "00000000-0000-4000-8000-000000000005",
    username: "exiled_knight",
    email: "exiled@dragonhold.realm",
    role: "CITIZEN",
    userStatus: "ACTIVE",
    citizenId: "10000000-0000-4000-8000-000000000005",
    citizenCode: "DH-000005",
    characterName: "Exiled Knight",
    citizenStatus: "SUSPENDED",
  },
};

type StoredPoll = {
  id: string;
  title: string;
  description: string;
  type: PollType;
  status: PollStatus;
  resultsVisibility: PollResultsVisibility;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  openedAt: Date | null;
  closedAt: Date | null;
  cancelledAt: Date | null;
  resultsPublishedAt: Date | null;
  resultsWithdrawnAt: Date | null;
  createdBy: string;
  openedBy: string | null;
  closedBy: string | null;
  publishedBy: string | null;
  withdrawnBy: string | null;
  cancelledBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredOption = {
  id: string;
  pollId: string;
  label: string;
  shortDescription: string;
  details: string;
  imageUrl: string | null;
  displayOrder: number;
};

type StoredVote = {
  id: string;
  pollId: string;
  optionId: string;
  citizenId: string;
  createdAt: Date;
};

function createStatefulVotingRepository(): VotingRepository {
  const pollsMap = new Map<string, StoredPoll>();
  const optionsMap = new Map<string, StoredOption[]>();
  const votesList: StoredVote[] = [];
  // Unique index simulation: `${pollId}:${citizenId}`
  const uniquePollCitizenVotes = new Set<string>();
  const auditMap = new Map<string, PollAuditEntry[]>();

  function getActorById(userId: string) {
    const found = Object.values(ACTORS).find((a) => a.userId === userId);
    return {
      id: userId,
      username: found?.username ?? "admin",
      role: found?.role ?? ("ADMIN" as const),
    };
  }

  function buildAdminDetail(pollId: string): AdminPollDetail {
    const poll = pollsMap.get(pollId);
    if (!poll) {
      throw new HttpError(
        404,
        "NOT_FOUND",
        "Sesi pemungutan suara tidak ditemukan.",
      );
    }

    const opts = optionsMap.get(pollId) ?? [];
    const pollVotesForId = votesList.filter((v) => v.pollId === pollId);
    const totalVotes = pollVotesForId.length;

    const options: AdminPollOptionResult[] = opts.map((opt) => {
      const voteCount = pollVotesForId.filter(
        (v) => v.optionId === opt.id,
      ).length;
      return {
        ...opt,
        voteCount,
        percentage: computePercentage(voteCount, totalVotes),
      };
    });

    return {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        type: poll.type,
        status: poll.status,
        resultsVisibility: poll.resultsVisibility,
        totalVotes,
        scheduledStartAt: poll.scheduledStartAt,
        scheduledEndAt: poll.scheduledEndAt,
        openedAt: poll.openedAt,
        closedAt: poll.closedAt,
        cancelledAt: poll.cancelledAt,
        resultsPublishedAt: poll.resultsPublishedAt,
        resultsWithdrawnAt: poll.resultsWithdrawnAt,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
      },
      options,
      auditHistory: auditMap.get(pollId) ?? [],
    };
  }

  function buildPublicCard(
    poll: StoredPoll,
    citizenId: string | null,
  ): PublicPollCard {
    const opts = optionsMap.get(poll.id) ?? [];
    const pollVotesForId = votesList.filter((v) => v.pollId === poll.id);
    const hasVoted = citizenId
      ? uniquePollCitizenVotes.has(`${poll.id}:${citizenId}`)
      : false;

    const safeOptions = opts.map((o) => ({
      id: o.id,
      label: o.label,
      shortDescription: o.shortDescription,
      details: o.details,
      imageUrl: o.imageUrl,
      displayOrder: o.displayOrder,
    }));

    const showResults = isResultsPubliclyVisible(poll);
    const totalVotes = pollVotesForId.length;

    const results = showResults
      ? {
          totalVotes,
          options: safeOptions.map((o) => {
            const voteCount = pollVotesForId.filter(
              (v) => v.optionId === o.id,
            ).length;
            return {
              ...o,
              voteCount,
              percentage: computePercentage(voteCount, totalVotes),
            };
          }),
        }
      : null;

    return {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      status: poll.status,
      resultsVisibility: poll.resultsVisibility,
      scheduledStartAt: poll.scheduledStartAt,
      scheduledEndAt: poll.scheduledEndAt,
      openedAt: poll.openedAt,
      closedAt: poll.closedAt,
      cancelledAt: poll.cancelledAt,
      resultsPublishedAt: poll.resultsPublishedAt,
      resultsWithdrawnAt: poll.resultsWithdrawnAt,
      createdAt: poll.createdAt,
      hasVoted,
      options: safeOptions,
      results,
    };
  }

  return {
    async getAdminOverviewAndList({ filter, page, limit }) {
      const all = Array.from(pollsMap.values());
      const stats: VotingOverviewStats = {
        totalPolls: all.length,
        draftPolls: all.filter((p) => p.status === "DRAFT").length,
        activePolls: all.filter((p) => p.status === "ACTIVE").length,
        closedPolls: all.filter((p) => p.status === "CLOSED").length,
        cancelledPolls: all.filter((p) => p.status === "CANCELLED").length,
        publishedResults: all.filter(
          (p) => p.status === "CLOSED" && p.resultsVisibility === "PUBLISHED",
        ).length,
        archivedResults: all.filter(
          (p) => p.status === "CLOSED" && p.resultsVisibility === "ARCHIVED",
        ).length,
        totalVotesCast: votesList.length,
      };

      const filtered = all.filter((p) => {
        if (filter === "ALL") return true;
        if (filter === "DRAFT") return p.status === "DRAFT";
        if (filter === "ACTIVE") return p.status === "ACTIVE";
        if (filter === "CLOSED") return p.status === "CLOSED";
        if (filter === "CANCELLED") return p.status === "CANCELLED";
        if (filter === "PUBLISHED")
          return p.status === "CLOSED" && p.resultsVisibility === "PUBLISHED";
        if (filter === "ARCHIVED")
          return p.status === "CLOSED" && p.resultsVisibility === "ARCHIVED";
        return true;
      });

      const summaries: AdminPollSummary[] = filtered.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        status: p.status,
        resultsVisibility: p.resultsVisibility,
        totalVotes: votesList.filter((v) => v.pollId === p.id).length,
        optionCount: (optionsMap.get(p.id) ?? []).length,
        scheduledStartAt: p.scheduledStartAt,
        scheduledEndAt: p.scheduledEndAt,
        openedAt: p.openedAt,
        closedAt: p.closedAt,
        cancelledAt: p.cancelledAt,
        resultsPublishedAt: p.resultsPublishedAt,
        resultsWithdrawnAt: p.resultsWithdrawnAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      return {
        stats,
        polls: summaries,
        pagination: {
          page,
          limit,
          total: summaries.length,
          totalPages: Math.max(1, Math.ceil(summaries.length / limit)),
        },
      };
    },

    async createPoll(actorUserId: string, input: CreatePollInput) {
      const id = randomUUID();
      const now = new Date();
      const poll: StoredPoll = {
        id,
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
        openedAt: null,
        closedAt: null,
        cancelledAt: null,
        resultsPublishedAt: null,
        resultsWithdrawnAt: null,
        createdBy: actorUserId,
        openedBy: null,
        closedBy: null,
        publishedBy: null,
        withdrawnBy: null,
        cancelledBy: null,
        createdAt: now,
        updatedAt: now,
      };
      pollsMap.set(id, poll);

      const opts: StoredOption[] = input.options.map((o, idx) => ({
        id: randomUUID(),
        pollId: id,
        label: o.label,
        shortDescription: o.shortDescription ?? "",
        details: o.details ?? "",
        imageUrl: o.imageUrl ?? null,
        displayOrder: idx,
      }));
      optionsMap.set(id, opts);

      auditMap.set(id, [
        {
          id: randomUUID(),
          pollId: id,
          action: "poll.create",
          metadata: { type: input.type, optionCount: opts.length },
          createdAt: now,
          actor: getActorById(actorUserId),
        },
      ]);

      return buildAdminDetail(id);
    },

    async getAdminPollDetail(pollId: string) {
      return buildAdminDetail(pollId);
    },

    async transitionLifecycle(
      pollId: string,
      actorUserId: string,
      action: LifecycleAction,
    ) {
      const poll = pollsMap.get(pollId);
      if (!poll) {
        throw new HttpError(
          404,
          "NOT_FOUND",
          "Sesi pemungutan suara tidak ditemukan.",
        );
      }

      const opts = optionsMap.get(pollId) ?? [];
      const now = new Date();
      const prevStatus = poll.status;
      const prevVis = poll.resultsVisibility;
      let auditAction = "";

      if (action === "open") {
        if (poll.status !== "DRAFT") {
          throw new HttpError(
            400,
            "INVALID_POLL_TRANSITION",
            "Hanya pemungutan suara berstatus DRAFT yang dapat dibuka.",
          );
        }
        if (opts.length < 2) {
          throw new HttpError(
            400,
            "INVALID_POLL_TRANSITION",
            "Minimal 2 pilihan diperlukan.",
          );
        }
        poll.status = "ACTIVE";
        poll.openedAt = now;
        poll.openedBy = actorUserId;
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
        poll.status = "CLOSED";
        poll.closedAt = now;
        poll.closedBy = actorUserId;
        auditAction = "poll.close";
      } else if (action === "publish-results") {
        if (poll.status !== "CLOSED" || poll.resultsVisibility !== "HIDDEN") {
          throw new HttpError(
            400,
            "INVALID_POLL_TRANSITION",
            "Hasil hanya dapat dipublikasikan setelah ditutup dan masih HIDDEN.",
          );
        }
        poll.resultsVisibility = "PUBLISHED";
        poll.resultsPublishedAt = now;
        poll.publishedBy = actorUserId;
        auditAction = "poll.results_publish";
      } else if (action === "withdraw-results") {
        if (
          poll.status !== "CLOSED" ||
          poll.resultsVisibility !== "PUBLISHED"
        ) {
          throw new HttpError(
            400,
            "INVALID_POLL_TRANSITION",
            "Hanya hasil PUBLISHED yang dapat ditarik ke arsip.",
          );
        }
        poll.resultsVisibility = "ARCHIVED";
        poll.resultsWithdrawnAt = now;
        poll.withdrawnBy = actorUserId;
        auditAction = "poll.results_withdraw";
      } else if (action === "republish-results") {
        if (poll.status !== "CLOSED" || poll.resultsVisibility !== "ARCHIVED") {
          throw new HttpError(
            400,
            "INVALID_POLL_TRANSITION",
            "Hanya hasil ARCHIVED yang dapat dipublikasikan kembali.",
          );
        }
        poll.resultsVisibility = "PUBLISHED";
        poll.resultsPublishedAt = now;
        poll.publishedBy = actorUserId;
        auditAction = "poll.results_republish";
      } else if (action === "cancel") {
        if (poll.status !== "DRAFT" && poll.status !== "ACTIVE") {
          throw new HttpError(
            400,
            "INVALID_POLL_TRANSITION",
            "Pemungutan suara yang sudah selesai tidak dapat dibatalkan.",
          );
        }
        poll.status = "CANCELLED";
        poll.resultsVisibility = "HIDDEN";
        poll.cancelledAt = now;
        poll.cancelledBy = actorUserId;
        auditAction = "poll.cancel";
      }

      poll.updatedAt = now;
      const history = auditMap.get(pollId) ?? [];
      history.unshift({
        id: randomUUID(),
        pollId,
        action: auditAction,
        metadata: { previousStatus: prevStatus, previousVisibility: prevVis },
        createdAt: now,
        actor: getActorById(actorUserId),
      });
      auditMap.set(pollId, history);

      return buildAdminDetail(pollId);
    },

    async getPublicVotingOverview(citizenId: string | null) {
      const visible = Array.from(pollsMap.values()).filter((p) => {
        if (p.status === "DRAFT") return false;
        if (p.status === "CANCELLED" && !p.openedAt) return false;
        if (p.status === "CLOSED" && p.resultsVisibility === "ARCHIVED")
          return false;
        return true;
      });

      const cards = visible.map((p) => buildPublicCard(p, citizenId));
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

    async getPublicPollById(pollId: string, citizenId: string | null) {
      const poll = pollsMap.get(pollId);
      if (
        !poll ||
        poll.status === "DRAFT" ||
        (poll.status === "CANCELLED" && !poll.openedAt)
      ) {
        throw new HttpError(
          404,
          "NOT_FOUND",
          "Sesi pemungutan suara tidak ditemukan.",
        );
      }
      return buildPublicCard(poll, citizenId);
    },

    async getPublicArchive({ page, limit, type, citizenId }) {
      const archived = Array.from(pollsMap.values()).filter((p) => {
        if (p.status !== "CLOSED") return false;
        if (
          p.resultsVisibility !== "PUBLISHED" &&
          p.resultsVisibility !== "ARCHIVED"
        ) {
          return false;
        }
        if (type && p.type !== type) return false;
        return true;
      });

      const total = archived.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const offset = (page - 1) * limit;
      const slice = archived.slice(offset, offset + limit);

      return {
        polls: slice.map((p) => buildPublicCard(p, citizenId)),
        pagination: { page, limit, total, totalPages },
      };
    },

    async castVote({ pollId, optionId, citizenId }) {
      const actor = Object.values(ACTORS).find(
        (a) => a.citizenId === citizenId,
      );
      if (!actor || actor.citizenStatus !== "ACTIVE") {
        throw new HttpError(
          403,
          "CITIZEN_INELIGIBLE",
          "Hanya warga negara berstatus ACTIVE yang berhak memberikan suara.",
        );
      }

      const poll = pollsMap.get(pollId);
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

      const opts = optionsMap.get(pollId) ?? [];
      const opt = opts.find((o) => o.id === optionId && o.pollId === pollId);
      if (!opt) {
        throw new HttpError(
          400,
          "INVALID_OPTION",
          "Pilihan tidak valid untuk sesi pemungutan suara ini.",
        );
      }

      // Enforce UNIQUE (poll_id, citizen_id) atomically
      const uniqueKey = `${pollId}:${citizenId}`;
      if (uniquePollCitizenVotes.has(uniqueKey)) {
        throw new HttpError(
          409,
          "ALREADY_VOTED",
          "Kamu sudah memberikan suara pada pemungutan suara ini.",
        );
      }
      uniquePollCitizenVotes.add(uniqueKey);

      const vote: StoredVote = {
        id: randomUUID(),
        pollId,
        optionId,
        citizenId,
        createdAt: new Date(),
      };
      votesList.push(vote);

      return {
        voteId: vote.id,
        pollId: vote.pollId,
        optionId: vote.optionId,
        createdAt: vote.createdAt,
      };
    },
  };
}

function createVotingTestHarness() {
  const config: AppConfig = {
    webOrigins: ["http://localhost:3000"],
    isProd: false,
    trustedProxyHops: 0,
  };

  let currentActor: TestActor | null = null;
  const repo = createStatefulVotingRepository();

  const mockDb = {
    __votingRepo: repo,
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          leftJoin: () => ({
            where: () => ({
              limit: async () => {
                if (!currentActor) return [];
                return [
                  {
                    sessionId: "sess-test-1",
                    expiresAt: new Date(Date.now() + 3600_000),
                    userId: currentActor.userId,
                    username: currentActor.username,
                    email: currentActor.email,
                    role: currentActor.role,
                    userStatus: currentActor.userStatus,
                    citizenId: currentActor.citizenId,
                    citizenCode: currentActor.citizenCode,
                    characterName: currentActor.characterName,
                    citizenStatus: currentActor.citizenStatus,
                  },
                ];
              },
            }),
          }),
        }),
      }),
    }),
  };

  const app = createApp(
    mockDb as unknown as Parameters<typeof createApp>[0],
    config,
  );

  async function requestAs(
    actor: TestActor | null,
    path: string,
    init: RequestInit = {},
  ) {
    currentActor = actor;
    const headers = new Headers(init.headers);
    if (!headers.has("Origin")) {
      headers.set("Origin", "http://localhost:3000");
    }
    if (actor) {
      headers.set("Cookie", `dh_session=${actor.token}`);
    }
    return app.request(path, { ...init, headers });
  }

  return { app, requestAs, repo };
}

test("Authorization: unauthenticated and non-admin users cannot access /admin/voting endpoints", async () => {
  const { requestAs } = createVotingTestHarness();

  // Unauthenticated -> 401
  const unauthRes = await requestAs(null, "/admin/voting");
  assert.equal(unauthRes.status, 401);

  const unauthCreate = await requestAs(null, "/admin/voting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(unauthCreate.status, 401);

  // Regular Citizen -> 403
  const citizenRes = await requestAs(ACTORS.citizenOne!, "/admin/voting");
  assert.equal(citizenRes.status, 403);
  const citizenBody = (await citizenRes.json()) as { error: { code: string } };
  assert.equal(citizenBody.error.code, "FORBIDDEN");

  const citizenCreate = await requestAs(ACTORS.citizenOne!, "/admin/voting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Unauthorized Poll Attempt",
      description: "Citizens cannot create kingdom polls.",
      type: "KINGDOM_DECISION",
      options: [{ label: "Option A" }, { label: "Option B" }],
    }),
  });
  assert.equal(citizenCreate.status, 403);

  // Admin -> 200
  const adminRes = await requestAs(ACTORS.admin!, "/admin/voting");
  assert.equal(adminRes.status, 200);
});

test("Voting lifecycle & confidentiality: Draft -> Open -> Vote -> Close (Hidden) -> Publish -> Withdraw (Archive) -> Republish", async () => {
  const { requestAs } = createVotingTestHarness();

  // 1. Admin creates a Leadership Election draft
  const createRes = await requestAs(ACTORS.superAdmin!, "/admin/voting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Election of the High Warden of Dragonhold",
      description:
        "Select the commander who will guard the Obsidian Bastion for the next cycle.",
      type: "LEADERSHIP_ELECTION",
      options: [
        {
          label: "Commander Vaelen Thorne",
          shortDescription: "Veteran of the Northern Watch",
          details: "Promises to fortify the outer ramparts.",
          imageUrl: "/images/hero-gates.jpg",
        },
        {
          label: "Lady Seraphina Kael",
          shortDescription: "Master of the Arcane Vanguard",
          details: "Advocates for warded sky-towers across Aetherial.",
        },
      ],
    }),
  });

  assert.equal(createRes.status, 201);
  const created = (await createRes.json()) as AdminPollDetail;
  const pollId = created.poll.id;
  const optionOneId = created.options[0]!.id;
  const optionTwoId = created.options[1]!.id;

  assert.equal(created.poll.status, "DRAFT");
  assert.equal(created.poll.resultsVisibility, "HIDDEN");

  // 2. Draft voting rejects votes and is hidden from public browsing
  const publicDraftRes = await requestAs(null, `/voting/${pollId}`);
  assert.equal(publicDraftRes.status, 404);

  const voteOnDraftRes = await requestAs(
    ACTORS.citizenOne!,
    `/voting/${pollId}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: optionOneId }),
    },
  );
  assert.equal(voteOnDraftRes.status, 403);
  const voteOnDraftBody = (await voteOnDraftRes.json()) as {
    error: { code: string };
  };
  assert.equal(voteOnDraftBody.error.code, "VOTING_NOT_ACTIVE");

  // 3. Admin opens the voting session
  const openRes = await requestAs(
    ACTORS.superAdmin!,
    `/admin/voting/${pollId}/open`,
    { method: "POST" },
  );
  assert.equal(openRes.status, 200);
  const opened = (await openRes.json()) as AdminPollDetail;
  assert.equal(opened.poll.status, "ACTIVE");
  assert.equal(opened.poll.resultsVisibility, "HIDDEN");

  // 4. Active voting accepts eligible citizen votes
  const vote1Res = await requestAs(
    ACTORS.citizenOne!,
    `/voting/${pollId}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: optionOneId }),
    },
  );
  assert.equal(vote1Res.status, 201);

  const vote2Res = await requestAs(
    ACTORS.citizenTwo!,
    `/voting/${pollId}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: optionOneId }),
    },
  );
  assert.equal(vote2Res.status, 201);

  const vote3Res = await requestAs(ACTORS.admin!, `/voting/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optionId: optionTwoId }),
  });
  assert.equal(vote3Res.status, 201);

  // 5. While ACTIVE, public endpoints NEVER expose intermediate vote counts
  const activePublicDetailRes = await requestAs(
    ACTORS.citizenOne!,
    `/voting/${pollId}`,
  );
  assert.equal(activePublicDetailRes.status, 200);
  const activePublicDetail = (await activePublicDetailRes.json()) as {
    poll: PublicPollCard;
  };
  assert.equal(activePublicDetail.poll.hasVoted, true);
  assert.equal(activePublicDetail.poll.results, null);
  for (const opt of activePublicDetail.poll.options) {
    assert.equal("voteCount" in opt, false);
    assert.equal("percentage" in opt, false);
  }

  // 6. Admin closes the active voting session
  const closeRes = await requestAs(
    ACTORS.superAdmin!,
    `/admin/voting/${pollId}/close`,
    { method: "POST" },
  );
  assert.equal(closeRes.status, 200);
  const closed = (await closeRes.json()) as AdminPollDetail;
  assert.equal(closed.poll.status, "CLOSED");
  // Closing must NOT publish results automatically
  assert.equal(closed.poll.resultsVisibility, "HIDDEN");
  assert.equal(closed.poll.totalVotes, 3);

  // 7. Closed voting rejects new votes
  const lateVoteRes = await requestAs(
    ACTORS.superAdmin!,
    `/voting/${pollId}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: optionTwoId }),
    },
  );
  assert.equal(lateVoteRes.status, 403);
  const lateVoteBody = (await lateVoteRes.json()) as {
    error: { code: string };
  };
  assert.equal(lateVoteBody.error.code, "VOTING_NOT_ACTIVE");

  // 8. Public endpoints still keep results confidential while CLOSED + HIDDEN
  const closedHiddenPublicRes = await requestAs(null, `/voting/${pollId}`);
  assert.equal(closedHiddenPublicRes.status, 200);
  const closedHiddenPublic = (await closedHiddenPublicRes.json()) as {
    poll: PublicPollCard;
  };
  assert.equal(closedHiddenPublic.poll.status, "CLOSED");
  assert.equal(closedHiddenPublic.poll.resultsVisibility, "HIDDEN");
  assert.equal(closedHiddenPublic.poll.results, null);

  const archiveBeforePublishRes = await requestAs(null, "/voting/archive");
  assert.equal(archiveBeforePublishRes.status, 200);
  const archiveBeforePublish = (await archiveBeforePublishRes.json()) as {
    polls: PublicPollCard[];
  };
  assert.equal(archiveBeforePublish.polls.length, 0);

  // 9. Admin publishes closed voting results
  const publishRes = await requestAs(
    ACTORS.superAdmin!,
    `/admin/voting/${pollId}/publish-results`,
    { method: "POST" },
  );
  assert.equal(publishRes.status, 200);
  const published = (await publishRes.json()) as AdminPollDetail;
  assert.equal(published.poll.status, "CLOSED");
  assert.equal(published.poll.resultsVisibility, "PUBLISHED");
  assert.ok(published.poll.resultsPublishedAt);

  // Public overview and detail now expose official results
  const publicOverviewAfterPublishRes = await requestAs(null, "/voting");
  const publicOverviewAfterPublish =
    (await publicOverviewAfterPublishRes.json()) as {
      publishedPolls: PublicPollCard[];
    };
  assert.equal(publicOverviewAfterPublish.publishedPolls.length, 1);
  assert.equal(
    publicOverviewAfterPublish.publishedPolls[0]!.results?.totalVotes,
    3,
  );
  assert.equal(
    publicOverviewAfterPublish.publishedPolls[0]!.results?.options[0]!
      .voteCount,
    2,
  );
  assert.equal(
    publicOverviewAfterPublish.publishedPolls[0]!.results?.options[0]!
      .percentage,
    66.7,
  );
  assert.equal(
    publicOverviewAfterPublish.publishedPolls[0]!.results?.options[1]!
      .voteCount,
    1,
  );
  assert.equal(
    publicOverviewAfterPublish.publishedPolls[0]!.results?.options[1]!
      .percentage,
    33.3,
  );

  // 10. Admin withdraws published announcement -> moves to ARCHIVED without losing votes
  const withdrawRes = await requestAs(
    ACTORS.superAdmin!,
    `/admin/voting/${pollId}/withdraw-results`,
    { method: "POST" },
  );
  assert.equal(withdrawRes.status, 200);
  const withdrawn = (await withdrawRes.json()) as AdminPollDetail;
  assert.equal(withdrawn.poll.status, "CLOSED");
  assert.equal(withdrawn.poll.resultsVisibility, "ARCHIVED");
  assert.equal(withdrawn.poll.totalVotes, 3);

  // Removed from active announcements on /voting, but present in /voting/archive
  const overviewAfterWithdrawRes = await requestAs(null, "/voting");
  const overviewAfterWithdraw = (await overviewAfterWithdrawRes.json()) as {
    publishedPolls: PublicPollCard[];
  };
  assert.equal(overviewAfterWithdraw.publishedPolls.length, 0);

  const archiveAfterWithdrawRes = await requestAs(null, "/voting/archive");
  const archiveAfterWithdraw = (await archiveAfterWithdrawRes.json()) as {
    polls: PublicPollCard[];
  };
  assert.equal(archiveAfterWithdraw.polls.length, 1);
  assert.equal(archiveAfterWithdraw.polls[0]!.resultsVisibility, "ARCHIVED");
  assert.equal(archiveAfterWithdraw.polls[0]!.results?.totalVotes, 3);

  // 11. Admin republishes archived results -> preserves original vote totals
  const republishRes = await requestAs(
    ACTORS.superAdmin!,
    `/admin/voting/${pollId}/republish-results`,
    { method: "POST" },
  );
  assert.equal(republishRes.status, 200);
  const republished = (await republishRes.json()) as AdminPollDetail;
  assert.equal(republished.poll.status, "CLOSED");
  assert.equal(republished.poll.resultsVisibility, "PUBLISHED");
  assert.equal(republished.poll.totalVotes, 3);
  assert.equal(republished.options[0]!.voteCount, 2);
  assert.equal(republished.options[1]!.voteCount, 1);
});

test("Vote integrity: duplicate vote rejection, concurrent duplicate submissions, cross-poll option rejection, inactive citizen, and unauthenticated visitor", async () => {
  const { requestAs } = createVotingTestHarness();

  // Create & open Poll A
  const createARes = await requestAs(ACTORS.superAdmin!, "/admin/voting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Royal Treasury Allocation Decree",
      description: "Determine how the kingdom surplus shall be invested.",
      type: "KINGDOM_DECISION",
      options: [
        { label: "Expand the Dragonforge" },
        { label: "Rebuild the Harbor Watchtowers" },
      ],
    }),
  });
  const pollA = (await createARes.json()) as AdminPollDetail;
  const pollAId = pollA.poll.id;
  const pollAOptionId = pollA.options[0]!.id;

  await requestAs(ACTORS.superAdmin!, `/admin/voting/${pollAId}/open`, {
    method: "POST",
  });

  // Create & open Poll B
  const createBRes = await requestAs(ACTORS.superAdmin!, "/admin/voting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Northern Border Treaty",
      description: "Decide whether to ratify the frost-clan trade pact.",
      type: "KINGDOM_DECISION",
      options: [{ label: "Ratify Treaty" }, { label: "Reject Treaty" }],
    }),
  });
  const pollB = (await createBRes.json()) as AdminPollDetail;
  const pollBId = pollB.poll.id;
  const pollBOptionId = pollB.options[0]!.id;

  await requestAs(ACTORS.superAdmin!, `/admin/voting/${pollBId}/open`, {
    method: "POST",
  });

  // 1. Unauthenticated visitors cannot submit votes -> 401
  const unauthVote = await requestAs(null, `/voting/${pollAId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optionId: pollAOptionId }),
  });
  assert.equal(unauthVote.status, 401);

  // 2. Inactive/suspended citizens cannot vote -> 403 CITIZEN_INELIGIBLE
  const suspendedVote = await requestAs(
    ACTORS.suspendedCitizen!,
    `/voting/${pollAId}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: pollAOptionId }),
    },
  );
  assert.equal(suspendedVote.status, 403);
  const suspendedBody = (await suspendedVote.json()) as {
    error: { code: string };
  };
  assert.equal(suspendedBody.error.code, "CITIZEN_INELIGIBLE");

  // 3. Citizen cannot vote using an option ID belonging to another voting session -> 400 INVALID_OPTION
  const crossOptionVote = await requestAs(
    ACTORS.citizenOne!,
    `/voting/${pollAId}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: pollBOptionId }),
    },
  );
  assert.equal(crossOptionVote.status, 400);
  const crossOptionBody = (await crossOptionVote.json()) as {
    error: { code: string };
  };
  assert.equal(crossOptionBody.error.code, "INVALID_OPTION");

  // 4. Concurrent duplicate submissions cannot create duplicate votes
  const concurrentAttempts = await Promise.all(
    Array.from({ length: 5 }, () =>
      requestAs(ACTORS.citizenOne!, `/voting/${pollAId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: pollAOptionId }),
      }),
    ),
  );

  const statuses = concurrentAttempts.map((r) => r.status);
  const createdCount = statuses.filter((s) => s === 201).length;
  const conflictCount = statuses.filter((s) => s === 409).length;

  assert.equal(createdCount, 1);
  assert.equal(conflictCount, 4);

  // 5. Subsequent sequential duplicate vote is also rejected with 409 ALREADY_VOTED
  const duplicateVote = await requestAs(
    ACTORS.citizenOne!,
    `/voting/${pollAId}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: pollAOptionId }),
    },
  );
  assert.equal(duplicateVote.status, 409);
  const duplicateBody = (await duplicateVote.json()) as {
    error: { code: string };
  };
  assert.equal(duplicateBody.error.code, "ALREADY_VOTED");

  // Verify total recorded votes on Poll A is strictly 1
  const detailAfterConcurrent = await requestAs(
    ACTORS.superAdmin!,
    `/admin/voting/${pollAId}`,
  );
  const detailBody = (await detailAfterConcurrent.json()) as AdminPollDetail;
  assert.equal(detailBody.poll.totalVotes, 1);
});
