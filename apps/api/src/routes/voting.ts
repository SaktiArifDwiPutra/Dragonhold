import { archivePollsQuerySchema, castVoteSchema } from "@dragonhold/shared";
import { Hono } from "hono";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { validate } from "../lib/validate";
import { getVotingRepository } from "../lib/voting-store";
import { optionalAuth, requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const pollIdParamSchema = z.object({
  id: z.string().uuid("ID pemungutan suara tidak valid."),
});

export const votingRoutes = new Hono<AppEnv>();

votingRoutes.get("/", optionalAuth, async (c) => {
  const auth = c.get("auth");
  const repo = getVotingRepository(c.get("db"));
  const data = await repo.getPublicVotingOverview(auth?.citizenId ?? null);
  return c.json(data);
});

votingRoutes.get(
  "/archive",
  optionalAuth,
  validate("query", archivePollsQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const auth = c.get("auth");
    const repo = getVotingRepository(c.get("db"));
    const data = await repo.getPublicArchive({
      ...query,
      citizenId: auth?.citizenId ?? null,
    });
    return c.json(data);
  },
);

votingRoutes.get(
  "/:id",
  optionalAuth,
  validate("param", pollIdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const auth = c.get("auth");
    const repo = getVotingRepository(c.get("db"));
    const poll = await repo.getPublicPollById(id, auth?.citizenId ?? null);
    return c.json({ poll });
  },
);

votingRoutes.post(
  "/:id/vote",
  requireAuth,
  validate("param", pollIdParamSchema),
  validate("json", castVoteSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { optionId } = c.req.valid("json");
    const auth = c.get("auth");

    if (!auth.citizenId || (auth.citizenStatus && auth.citizenStatus !== "ACTIVE")) {
      throw new HttpError(
        403,
        "CITIZEN_INELIGIBLE",
        "Hanya warga negara berstatus ACTIVE yang berhak memberikan suara.",
      );
    }

    const repo = getVotingRepository(c.get("db"));
    const vote = await repo.castVote({
      pollId: id,
      optionId,
      citizenId: auth.citizenId,
    });

    return c.json({ vote }, 201);
  },
);
