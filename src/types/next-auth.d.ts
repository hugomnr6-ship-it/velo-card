import "next-auth";
import type { AuthProvider } from "@/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      stravaId: number;
      accessToken: string;
      provider: AuthProvider;
      oauthTokenSecret?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    stravaId?: number;
    providerId?: number;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    provider?: string;
    oauthTokenSecret?: string;
  }
}
