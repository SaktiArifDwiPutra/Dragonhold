export type MeResponse = {
  user: { id: string; username: string; role: string; email?: string };
  citizen: {
    id: string;
    citizenCode: string | null;
    characterName: string | null;
    status?: string | null;
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

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  ALREADY_EXISTS: "That username or email is already taken.",
  RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
  ACCOUNT_SUSPENDED: "This account has been suspended.",
  VALIDATION_ERROR: "Please check the highlighted fields.",
  INVALID_BETA_CODE: "Closed beta access code is incorrect.",
  REGISTRATION_UNAVAILABLE: "Closed beta registration is currently closed.",
  REGISTRATION_DISABLED: "Public registration is currently closed.",
  FORBIDDEN: "You do not have permission to access this resource.",
  ALREADY_VOTED: "Your vote has already been sealed for this voting session.",
  VOTING_NOT_ACTIVE: "This voting session is not currently open for voting.",
  CITIZEN_INELIGIBLE: "Only active citizens of Dragonhold may cast a vote.",
  INVALID_OPTION: "The selected option is invalid for this voting session.",
  INVALID_POLL_TRANSITION: "This lifecycle action is not allowed in the current voting state.",
  BAD_ORIGIN: "Request rejected: unauthorized origin.",
};

export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    return MESSAGES[err.code] ?? "Something went wrong. Please try again.";
  }
  return "Cannot reach the server. Please try again.";
}