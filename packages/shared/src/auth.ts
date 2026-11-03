import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter.")
  .max(32, "Username maksimal 32 karakter.")
  .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore.")
  .transform((v) => v.toLowerCase());

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Format email tidak valid.")
  .max(255);

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: z
      .string()
      .min(10, "Password minimal 10 karakter.")
      .max(128, "Password maksimal 128 karakter."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak cocok.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  // tanpa batas minimum agar akun seed tetap bisa login
  password: z.string().min(1, "Password wajib diisi.").max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;