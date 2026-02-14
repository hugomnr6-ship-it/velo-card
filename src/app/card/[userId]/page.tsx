import { supabaseAdmin } from "@/lib/supabase";
import VeloCard from "@/components/VeloCard";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";

// Public card page — /card/[userId]
export default async function CardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  // Fetch profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", userId)
    .single();

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-4">
        <p className="text-lg font-bold text-white">Profil introuvable</p>
        <p className="text-sm text-neutral-500">
          Ce cycliste n&apos;existe pas ou n&apos;a pas encore synchronise ses donnees.
        </p>
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12">
      <VeloCard
        username={profile.username}
        avatarUrl={profile.avatar_url}
        stats={computedStats}
        tier={tier}
        badges={badges}
        clubs={clubs}
      />
      <p className="mt-6 text-center text-xs text-neutral-600">
        {profile.username} sur VeloCard
      </p>
    </main>
  );
}
