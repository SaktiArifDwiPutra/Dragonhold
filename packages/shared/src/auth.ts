import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be at most 32 characters.")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores.")
  .transform((v) => v.toLowerCase());

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(255);

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: z
      .string()
      .min(10, "Password must be at least 10 characters.")
      .max(128, "Password must be at most 128 characters."),
    confirmPassword: z.string(),
    betaCode: z.string().trim().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128),
});

export const displayNameSchema = z
  .string()
  .trim()
  .max(64, "Display name must be at most 64 characters.")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const avatarUrlSchema = z
  .string()
  .trim()
  .max(512, "Avatar URL must be at most 512 characters.")
  .refine(
    (v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v),
    "Enter a valid http:// or https:// image URL.",
  )
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const googleOnboardingSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
});

export const linkExistingAccountSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleOnboardingInput = z.infer<typeof googleOnboardingSchema>;
export type LinkExistingAccountInput = z.infer<typeof linkExistingAccountSchema>;