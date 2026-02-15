import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import VeloCard from "@/components/VeloCard";
import Link from "next/link";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";

// Public card page — /card/[userId]
export default async function CardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);

  // Fetch profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
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

  // TODO: Fetch badges when badge system is implemented
  const badges: Badge[] = [];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B1120] px-4 py-12">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(108,92,231,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10">
        <VeloCard
          username={profile.username}
          avatarUrl={profile.avatar_url}
          stats={computedStats}
          tier={tier}
          badges={badges}
          clubs={clubs}
        />
      </div>

      <p className="relative z-10 mt-6 text-center text-xs text-[#475569]">
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
