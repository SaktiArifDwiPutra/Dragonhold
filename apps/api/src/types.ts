import type { Database } from "@dragonhold/db";
import type { GoogleOAuthClient } from "./lib/google-oauth";

export type AppConfig = {
  webOrigins: string[];
  isProd: boolean;
  trustedProxyHops: number;
  registrationMode?: "closed_beta" | "open";
  betaAccessCode?: string;
  cookieDomain?: string;
  basePath?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  googleOAuthClient?: GoogleOAuthClient;
};

export type AuthContext = {
  sessionId: string;
  userId: string;
  username: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "CITIZEN";
  citizenId: string | null;
  citizenCode: string | null;
  characterName: string | null;
  avatarUrl?: string | null;
  citizenStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | null;
};

export type AppEnv = {
  Variables: {
    db: Database;
    config: AppConfig;
    auth: AuthContext;
  };
};
