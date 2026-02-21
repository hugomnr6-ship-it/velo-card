import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { supabaseAdmin } from "./lib/supabase";
import { enrollBetaTester } from "./services/beta.service";

export type AuthProvider = "strava" | "garmin" | "wahoo";

const config: NextAuthConfig = {
  trustHost: true,
  providers: [
    // ——— Strava (OAuth 2.0) ———
    {
      id: "strava",
      name: "Strava",
      type: "oauth",
      authorization: {
        url: "https://www.strava.com/oauth/authorize",
        params: { scope: "read,activity:read_all" },
      },
      token: "https://www.strava.com/oauth/token",
      userinfo: "https://www.strava.com/api/v3/athlete",
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      profile(profile) {
        return {
          id: String(profile.id),
          name: `${profile.firstname} ${profile.lastname}`,
          image: profile.profile,
        };
      },
    },

    // ——— Wahoo (OAuth 2.0) ———
    ...(process.env.WAHOO_CLIENT_ID
      ? [
          {
            id: "wahoo",
            name: "Wahoo",
            type: "oauth" as const,
            authorization: {
              url: "https://api.wahooligan.com/oauth/authorize",
              params: { scope: "user_read workouts_read" },
            },
            token: "https://api.wahooligan.com/oauth/token",
            userinfo: "https://api.wahooligan.com/v1/user",
            clientId: process.env.WAHOO_CLIENT_ID,
            clientSecret: process.env.WAHOO_CLIENT_SECRET,
            client: {
              token_endpoint_auth_method: "client_secret_post" as const,
            },
            profile(profile: Record<string, unknown>) {
              const user = (profile.user as Record<string, unknown>) || profile;
              return {
                id: String(user.id),
                name: `${user.first || ""} ${user.last || ""}`.trim() || "Wahoo User",
                image: null,
              };
            },
          },
        ]
      : []),

    // ——— Garmin (OAuth 1.0a) ———
    ...(process.env.GARMIN_CONSUMER_KEY
      ? [
          {
            id: "garmin",
            name: "Garmin",
            type: "oauth" as const,
            authorization: "https://connect.garmin.com/oauthConfirm",
            requestTokenUrl: "https://connectapi.garmin.com/oauth-service/oauth/request_token",
            accessTokenUrl: "https://connectapi.garmin.com/oauth-service/oauth/access_token",
            token: {
              url: "https://connectapi.garmin.com/oauth-service/oauth/access_token",
            },
            userinfo: {
              url: "https://apis.garmin.com/wellness-api/rest/user/id",
            },
            clientId: process.env.GARMIN_CONSUMER_KEY,
            clientSecret: process.env.GARMIN_CONSUMER_SECRET,
            profile(profile: Record<string, unknown>) {
              return {
                id: String(profile.userId || profile.id),
                name: (profile.displayName as string) || "Garmin User",
                image: (profile.profileImageUrl as string) || null,
              };
            },
          },
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        const provider = account.provider as AuthProvider;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.provider = provider;
        token.providerId = Number(account.providerAccountId);

        // For Garmin OAuth 1.0a, store the token secret too
        if (provider === "garmin" && (account as Record<string, unknown>).oauth_token_secret) {
          token.oauthTokenSecret = (account as Record<string, unknown>).oauth_token_secret as string;
        }

        // Store avatar URL in token so it persists
        token.picture = user?.image ?? (profile as Record<string, unknown>).profile ?? null;

        const providerProfile = profile as Record<string, unknown>;
        const username =
          provider === "strava"
            ? `${providerProfile.firstname} ${providerProfile.lastname}`
            : provider === "wahoo"
              ? `${(providerProfile.user as Record<string, unknown>)?.first || providerProfile.first || ""} ${(providerProfile.user as Record<string, unknown>)?.last || providerProfile.last || ""}`.trim() || "Wahoo User"
              : (providerProfile.displayName as string) || user?.name || "User";

        const avatarUrl =
          provider === "strava"
            ? (providerProfile.profile as string) ?? null
            : provider === "garmin"
              ? (providerProfile.profileImageUrl as string) ?? null
              : null;

        // Upsert profile in Supabase on sign-in
        console.log(`[AUTH] Upserting profile for ${provider}:`, account.providerAccountId);

        try {
          const upsertData: Record<string, unknown> = {
            username,
            avatar_url: avatarUrl,
            provider,
          };

          // Set provider-specific ID
          if (provider === "strava") {
            upsertData.strava_id = Number(account.providerAccountId);
          } else if (provider === "garmin") {
            upsertData.garmin_id = String(account.providerAccountId);
          } else if (provider === "wahoo") {
            upsertData.wahoo_id = Number(account.providerAccountId);
          }

          // Determine the conflict column
          const conflictCol =
            provider === "strava" ? "strava_id" :
            provider === "garmin" ? "garmin_id" :
            "wahoo_id";

          console.log("[AUTH] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING");
          console.log("[AUTH] Supabase Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING");
          console.log("[AUTH] Upsert data:", JSON.stringify(upsertData));

          const { data, error } = await supabaseAdmin
            .from("profiles")
            .upsert(upsertData, { onConflict: conflictCol })
            .select("id")
            .single();

          console.log("[AUTH] Supabase upsert result:", { data, error });

          if (data) {
            token.userId = data.id;

            // TODO: REMOVE THIS WHEN BETA ENDS — Hugo decides when
            try {
              await enrollBetaTester(data.id);
            } catch (e) {
              // Silently fail — beta might be full, that's OK
              console.warn("[AUTH] Beta enrollment:", e);
            }
          } else if (error) {
            console.error("[AUTH] Supabase upsert error:", error.message, error.details, error.hint);
          }
        } catch (dbError) {
          console.error("[AUTH] Supabase upsert exception:", dbError);
          // Don't throw — allow sign-in to proceed even if DB fails
        }
      }

      // Backward compat: old JWT tokens may not have providerId
      if (!token.providerId && token.userId) {
        try {
          const { data: existingProfile } = await supabaseAdmin
            .from("profiles")
            .select("strava_id, garmin_id, wahoo_id, provider")
            .eq("id", token.userId as string)
            .single();
          if (existingProfile) {
            token.providerId =
              existingProfile.strava_id ??
              existingProfile.wahoo_id ??
              existingProfile.garmin_id ??
              null;
            token.provider = token.provider || existingProfile.provider || "strava";
          }
        } catch {
          // Ignore - will be set on next sign-in
        }
      }

      // Refresh token if expired (OAuth 2.0 providers only)
      const provider = token.provider as AuthProvider | undefined;
      if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
        if (provider === "strava") {
          try {
            const res = await fetch("https://www.strava.com/oauth/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
              }),
            });
            const refreshed = await res.json();
            if (refreshed.access_token) {
              token.accessToken = refreshed.access_token;
              token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
              token.expiresAt = refreshed.expires_at;
            }
          } catch (err) {
            console.error("[AUTH] Strava token refresh failed:", err);
          }
        } else if (provider === "wahoo") {
          try {
            const res = await fetch("https://api.wahooligan.com/oauth/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.WAHOO_CLIENT_ID!,
                client_secret: process.env.WAHOO_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
              }),
            });
            const refreshed = await res.json();
            if (refreshed.access_token) {
              token.accessToken = refreshed.access_token;
              token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
              token.expiresAt = Math.floor(Date.now() / 1000) + (refreshed.expires_in || 7200);
            }
          } catch (err) {
            console.error("[AUTH] Wahoo token refresh failed:", err);
          }
        }
        // Garmin uses OAuth 1.0a — tokens don't expire
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.stravaId = token.providerId as number;
      session.user.accessToken = token.accessToken as string;
      session.user.image = (token.picture as string) ?? null;
      session.user.provider = (token.provider as AuthProvider) ?? "strava";
      session.user.oauthTokenSecret = (token.oauthTokenSecret as string) ?? undefined;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
