import { z } from "zod";

export const pollTypeSchema = z.enum([
  "LEADERSHIP_ELECTION",
  "KINGDOM_DECISION",
]);

export const pollStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "CLOSED",
  "CANCELLED",
]);

export const pollResultsVisibilitySchema = z.enum([
  "HIDDEN",
  "PUBLISHED",
  "ARCHIVED",
]);

export const imageUrlSchema = z
  .string()
  .trim()
  .max(512, "Image URL must be at most 512 characters.")
  .optional()
  .nullable()
  .transform((val) => (val && val.length > 0 ? val : null))
  .refine(
    (val) => {
      if (!val) return true;
      if (val.startsWith("/")) return !val.startsWith("//");
      try {
        const u = new URL(val);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Image URL must be a valid http(s) URL or relative path starting with /." },
  );

export const pollOptionInputSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Option title or candidate name is required.")
    .max(120, "Option title must be at most 120 characters."),
  shortDescription: z
    .string()
    .trim()
    .max(280, "Short description must be at most 280 characters.")
    .optional()
    .default(""),
  details: z
    .string()
    .trim()
    .max(2000, "Details or candidate vision must be at most 2000 characters.")
    .optional()
    .default(""),
  imageUrl: imageUrlSchema,
});

const optionalIsoDateSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val && val.length > 0 ? val : null))
  .refine(
    (val) => {
      if (!val) return true;
      const d = new Date(val);
      return !Number.isNaN(d.getTime());
    },
    { message: "Invalid date/time format." },
  );

export const createPollSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters.")
      .max(160, "Title must be at most 160 characters."),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters.")
      .max(5000, "Description must be at most 5000 characters."),
    type: pollTypeSchema,
    options: z
      .array(pollOptionInputSchema)
      .min(2, "At least 2 options or candidates are required.")
      .max(12, "At most 12 options or candidates are allowed.")
      .refine(
        (opts) => {
          const seen = new Set<string>();
          for (const opt of opts) {
            const key = opt.label.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        { message: "Each option or candidate must have a distinct name." },
      ),
    scheduledStartAt: optionalIsoDateSchema,
    scheduledEndAt: optionalIsoDateSchema,
  })
  .refine(
    (data) => {
      if (data.scheduledStartAt && data.scheduledEndAt) {
        return (
          new Date(data.scheduledEndAt).getTime() >
          new Date(data.scheduledStartAt).getTime()
        );
      }
      return true;
    },
    {
      path: ["scheduledEndAt"],
      message: "Planned end date must be after the start date.",
    },
  );

export const castVoteSchema = z.object({
  optionId: z.string().uuid("Please select a valid voting option."),
});

export const adminPollsQuerySchema = z.object({
  filter: z
    .enum([
      "ALL",
      "DRAFT",
      "ACTIVE",
      "CLOSED",
      "PUBLISHED",
      "ARCHIVED",
      "CANCELLED",
    ])
    .default("ALL"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const archivePollsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  type: pollTypeSchema.optional(),
});

export type PollType = z.infer<typeof pollTypeSchema>;
export type PollStatus = z.infer<typeof pollStatusSchema>;
export type PollResultsVisibility = z.infer<typeof pollResultsVisibilitySchema>;
export type PollOptionInput = z.infer<typeof pollOptionInputSchema>;
export type CreatePollInput = z.infer<typeof createPollSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
