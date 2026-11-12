import type { Database } from "@dragonhold/db";

export type AppConfig = {
  webOrigins: string[];
  isProd: boolean;
  trustedProxyHops: number;
  registrationMode: "closed_beta" | "open";
  betaAccessCode?: string;
  cookieDomain?: string;
  basePath?: string;
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
};

export type AppEnv = {
  Variables: {
    db: Database;
    config: AppConfig;
    auth: AuthContext;
  };
};