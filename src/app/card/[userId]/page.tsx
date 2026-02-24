import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";

import { auth } from "@/auth";
import VeloCard3DWrapper from "@/components/VeloCard3DWrapper";
import ShareButtonWrapper from "./ShareButtonWrapper";
import Link from "next/link";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";
import type { CardSkinId } from "@/components/VeloCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  const username = profile?.username ?? "Cycliste";

  return {
    title: `VeloCard de ${username}`,
    description: `Decouvre la VeloCard de ${username} — stats, tier et classement`,
    openGraph: {
      title: `VeloCard de ${username}`,
      description: `Decouvre la VeloCard de ${username}`,
      type: "website",
      images: [`/api/og/card/${userId}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `VeloCard de ${username}`,
      description: `Decouvre la VeloCard de ${username}`,
      images: [`/api/og/card/${userId}`],
    },
  };
}

// Public card page — /card/[userId]
export default async function CardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await auth();

  // Fetch profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url, country, country_code, equipped_skin")
    .eq("id", userId)
    .single();

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B1120] p-4">
        <p className="text-lg font-bold text-white">Profil introuvable</p>
        <p className="text-sm text-[#94A3B8]">
          Ce cycliste n&apos;existe pas ou n&apos;a pas encore synchronisé ses données.
        </p>
        <Link
          href="/"
          className="mt-4 rounded-full bg-[#6366F1] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5557E0]"
        >
          Crée ta carte
        </Link>
      </main>
    );
  }

  // Fetch stats
  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select('user_id, pac, "end", mon, res, spr, val, ovr, tier')
    .eq("user_id", userId)
    .single();

  // Fetch clubs
  const { data: clubMemberships } = await supabaseAdmin
    .from("club_members")
    .select("club_id")
    .eq("user_id", userId);

  let clubs: ClubInfo[] = [];
  if (clubMemberships && clubMemberships.length > 0) {
    const clubIds = clubMemberships.map((m: any) => m.club_id);
    const { data: clubData } = await supabaseAdmin
      .from("clubs")
      .select("name, logo_url")
      .in("id", clubIds);
    clubs = (clubData || []).map((c: any) => ({
      name: c.name,
      logo_url: c.logo_url || "",
    }));
  }

  // Fetch beta tester info
  const { data: betaInfo } = await supabaseAdmin
    .from("beta_testers")
    .select("beta_number")
    .eq("user_id", userId)
    .single();

  // Fetch special card
  const { data: specialCardData } = await supabaseAdmin
    .from("user_stats")
    .select("special_card")
    .eq("user_id", userId)
    .single();

  const computedStats: ComputedStats = {
    pac: stats?.pac || 0,
    end: stats?.end || 0,
    mon: stats?.mon || 0,
    res: stats?.res || 0,
    spr: stats?.spr || 0,
    val: stats?.val || 0,
    ovr: stats?.ovr || 0,
  };

  const tier: CardTier = (stats?.tier as CardTier) || "bronze";

  // Fetch badges
  const { data: userBadges } = await supabaseAdmin
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const badges: Badge[] = (userBadges || []).slice(0, 3).map((b: any) => ({
    id: b.badge_id,
    name: b.badge_id,
    emoji: b.badge_id,
  }));

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B1120] px-4 py-12">
      {/* Bouton retour */}
      <Link
        href={session ? `/profile/${userId}` : "/"}
        className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition"
        aria-label="Retour"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(108,92,231,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10">
        <VeloCard3DWrapper
          username={profile.username}
          avatarUrl={profile.avatar_url}
          stats={computedStats}
          tier={tier}
          badges={badges}
          clubs={clubs}
          country={profile.country || undefined}
          countryCode={profile.country_code || undefined}
          specialCard={specialCardData?.special_card || undefined}
          betaNumber={betaInfo?.beta_number || null}
          skin={(profile.equipped_skin as CardSkinId) || undefined}
        />
      </div>

      <div className="relative z-10 mt-6 flex items-center gap-3">
        <ShareButtonWrapper tier={tier} userId={userId} />
      </div>

      <p className="relative z-10 mt-3 text-center text-xs text-[#475569]">
        {profile.username} sur VeloCard
      </p>

      {/* CTA for non-logged-in visitors */}
      {!session && (
        <Link
          href="/"
          className="relative z-10 mt-6 rounded-full bg-[#6366F1] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#6366F1]/25 transition hover:bg-[#5557E0]"
        >
          Crée ta carte gratuitement
        </Link>
      )}
    </main>
  );
}
