import { adminPollsQuerySchema, createPollSchema } from "@dragonhold/shared";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../lib/validate";
import {
  getVotingRepository,
  type LifecycleAction,
} from "../lib/voting-store";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AppEnv } from "../types";

const pollIdParamSchema = z.object({
  id: z.string().uuid("ID pemungutan suara tidak valid."),
});

export const adminVotingRoutes = new Hono<AppEnv>();

// Every admin voting endpoint independently enforces authentication and admin role
adminVotingRoutes.use("*", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

adminVotingRoutes.get(
  "/",
  validate("query", adminPollsQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const repo = getVotingRepository(c.get("db"));
    const data = await repo.getAdminOverviewAndList(query);
    return c.json(data);
  },
);

adminVotingRoutes.post(
  "/",
  validate("json", createPollSchema),
  async (c) => {
    const input = c.req.valid("json");
    const auth = c.get("auth");
    const repo = getVotingRepository(c.get("db"));
    const created = await repo.createPoll(auth.userId, input);
    return c.json(created, 201);
  },
);

adminVotingRoutes.get(
  "/:id",
  validate("param", pollIdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const repo = getVotingRepository(c.get("db"));
    const detail = await repo.getAdminPollDetail(id);
    return c.json(detail);
  },
);

const LIFECYCLE_ACTIONS: LifecycleAction[] = [
  "open",
  "close",
  "publish-results",
  "withdraw-results",
  "republish-results",
  "cancel",
];

for (const action of LIFECYCLE_ACTIONS) {
  adminVotingRoutes.post(
    `/:id/${action}`,
    validate("param", pollIdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const auth = c.get("auth");
      const repo = getVotingRepository(c.get("db"));
      const updated = await repo.transitionLifecycle(id, auth.userId, action);
      return c.json(updated);
    },
  );
}
