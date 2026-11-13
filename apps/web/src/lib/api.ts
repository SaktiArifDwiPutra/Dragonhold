import { dictionaries, type Locale } from "./i18n/dictionaries";

export type MeResponse = {
  user: { id: string; username: string; role: string; email?: string };
  citizen: {
    id: string;
    citizenCode: string | null;
    characterName: string | null;
    avatarUrl?: string | null;
    status?: string | null;
  } | null;
  googleIdentity?: {
    provider: "google";
    email: string;
    emailVerified: boolean;
    linkedAt: string;
  } | null;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { json?: unknown };

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
    : "/api";

  const res = await fetch(`${baseUrl}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: Record<string, string[]> };
  } | null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code ?? "UNKNOWN",
      data?.error?.message ?? "Something went wrong.",
      data?.error?.details,
    );
  }
  return data as T;
}

export function errorText(err: unknown, lang: Locale = "en"): string {
  const messages = dictionaries[lang].apiErrors;
  if (err instanceof ApiError) {
    return (
      messages[err.code] ??
      messages.UNKNOWN ??
      "Something went wrong. Please try again."
    );
  }
  return messages.NETWORK ?? "Cannot reach the server. Please try again.";
}