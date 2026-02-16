import type { NextAuthOptions } from "next-auth";
import { supabaseAdmin } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "strava",
      name: "Strava",
      type: "oauth",
      authorization: {
        url: "https://www.strava.com/oauth/authorize",
        params: { scope: "read,activity:read" },
      },
      token: {
        url: "https://www.strava.com/oauth/token",
        async request({ params }) {
          const res = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: process.env.STRAVA_CLIENT_ID,
              client_secret: process.env.STRAVA_CLIENT_SECRET,
              code: params.code,
              grant_type: "authorization_code",
            }),
          });
          const tokens = await res.json();
          return { tokens };
        },
      },
      userinfo: "https://www.strava.com/api/v3/athlete",
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
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.stravaId = Number(account.providerAccountId);
        // Store avatar URL in token so it persists across sessions
        token.picture = user?.image ?? (profile as any).profile ?? null;

        const stravaProfile = profile as any;

        // Upsert profile in Supabase on sign-in
        // Club data is managed separately via /api/clubs (custom club system)
        console.log("[AUTH] Upserting profile for strava_id:", account.providerAccountId);
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              strava_id: Number(account.providerAccountId),
              username: `${stravaProfile.firstname} ${stravaProfile.lastname}`,
              avatar_url: stravaProfile.profile ?? null,
            },
            { onConflict: "strava_id" },
          )
          .select("id")
          .single();

        console.log("[AUTH] Supabase upsert result:", { data, error });

        if (data) {
          token.userId = data.id;
        }
      }
      // Refresh token if expired
      if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
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
          console.error("[AUTH] Token refresh failed:", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.stravaId = token.stravaId as number;
      session.user.accessToken = token.accessToken as string;
      session.user.image = (token.picture as string) ?? null;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
