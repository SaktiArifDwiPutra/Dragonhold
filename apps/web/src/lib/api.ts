export type MeResponse = {
  user: { id: string; username: string; role: string; email?: string };
  citizen: {
    id: string;
    citizenCode: string | null;
    characterName: string | null;
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
  const res = await fetch(`/api${path}`, {
    ...rest,
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

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  ALREADY_EXISTS: "That username or email is already taken.",
  RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
  ACCOUNT_SUSPENDED: "This account has been suspended.",
  VALIDATION_ERROR: "Please check the highlighted fields.",
};

export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    return MESSAGES[err.code] ?? "Something went wrong. Please try again.";
  }
  return "Cannot reach the server. Please try again.";
}