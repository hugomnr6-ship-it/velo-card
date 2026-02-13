import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { WarHistoryEntry } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("strava_id", session.user.stravaId)
      .single();

    if (!profile) {
      return Response.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // Get user's clubs
    const { data: memberships } = await supabaseAdmin
      .from("club_members")
      .select("club_id")
      .eq("user_id", profile.id);

    if (!memberships || memberships.length === 0) {
      return Response.json({ history: [] });
    }

    const clubIds = memberships.map((m: any) => m.club_id);

    // Get finished wars for any of the user's clubs
    const wars: WarHistoryEntry[] = [];

    for (const clubId of clubIds) {
      const { data: clubWars } = await supabaseAdmin
        .from("wars")
        .select("id, week_label, club_a_id, club_b_id, club_a_score, club_b_score, ends_at")
        .eq("status", "finished")
        .or(`club_a_id.eq.${clubId},club_b_id.eq.${clubId}`)
        .order("ends_at", { ascending: false })
        .limit(10);

      if (!clubWars) continue;

      for (const w of clubWars) {
        // Skip if already added (user in both clubs somehow)
        if (wars.find((e) => e.war_id === w.id)) continue;

        const isClubA = w.club_a_id === clubId;
        const oppClubId = isClubA ? w.club_b_id : w.club_a_id;
        const myScore = isClubA ? w.club_a_score : w.club_b_score;
        const oppScore = isClubA ? w.club_b_score : w.club_a_score;

        // Get opponent info
        const { data: oppClub } = await supabaseAdmin
          .from("clubs")
          .select("name, logo_url")
          .eq("id", oppClubId)
          .single();

        wars.push({
          war_id: w.id,
          week_label: w.week_label,
          opponent_name: oppClub?.name ?? "Club inconnu",
          opponent_logo_url: oppClub?.logo_url ?? null,
          my_score: myScore,
          opp_score: oppScore,
          result: myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "draw",
          ended_at: w.ends_at,
        });
      }
    }

    // Sort by most recent
    wars.sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime());

    return Response.json({ history: wars.slice(0, 10) });
  } catch (err: any) {
    console.error("War history error:", err);
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
