import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getWarWeekBounds,
  matchmakeClub,
  finalizeExpiredWars,
} from "@/lib/wars";
import type { WarDashboard, WarContribution } from "@/types";

export async function GET() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  try {
    // Get user's clubs
    const { data: memberships } = await supabaseAdmin
      .from("club_members")
      .select("club_id")
      .eq("user_id", profileId)
      .order("joined_at", { ascending: true });

    if (!memberships || memberships.length === 0) {
      const result: WarDashboard = {
        war: null,
        no_club: true,
        club_too_small: false,
        no_match_found: false,
        is_debrief_day: false,
      };
      return Response.json(result);
    }

    // Finalize any expired wars first
    await finalizeExpiredWars();

    const weekBounds = getWarWeekBounds();
    const isMonday = weekBounds === null;

    // If Monday (debrief), find last finished war for user's clubs
    if (isMonday) {
      const clubIds = memberships.map((m: any) => m.club_id);
      let lastWar = null;

      for (const cid of clubIds) {
        const { data: w } = await supabaseAdmin
          .from("wars")
          .select("*")
          .eq("status", "finished")
          .or(`club_a_id.eq.${cid},club_b_id.eq.${cid}`)
          .order("ends_at", { ascending: false })
          .limit(1)
          .single();

        if (w && (!lastWar || w.ends_at > lastWar.ends_at)) {
          lastWar = w;
        }
      }

      if (!lastWar) {
        const result: WarDashboard = {
          war: null,
          no_club: false,
          club_too_small: false,
          no_match_found: false,
          is_debrief_day: true,
        };
        return Response.json(result);
      }

      // Build debrief response
      return Response.json(await buildWarDashboard(lastWar, profileId, true));
    }

    // Tuesday-Sunday: find or create active war
    // Try each club the user is in
    let activeWar = null;
    let userClubId: string | null = null;

    for (const membership of memberships) {
      const cid = membership.club_id;

      // Check for existing active war
      const { data: existing } = await supabaseAdmin
        .from("wars")
        .select("*")
        .eq("week_label", weekBounds.week_label)
        .eq("status", "active")
        .or(`club_a_id.eq.${cid},club_b_id.eq.${cid}`)
        .single();

      if (existing) {
        activeWar = existing;
        userClubId = cid;
        break;
      }

      // Check for finished war this week (won early)
      const { data: finished } = await supabaseAdmin
        .from("wars")
        .select("*")
        .eq("week_label", weekBounds.week_label)
        .eq("status", "finished")
        .or(`club_a_id.eq.${cid},club_b_id.eq.${cid}`)
        .single();

      if (finished) {
        activeWar = finished;
        userClubId = cid;
        break;
      }
    }

    // No war found, try matchmaking for first club
    if (!activeWar) {
      for (const membership of memberships) {
        const cid = membership.club_id;

        // Check member count
        const { count } = await supabaseAdmin
          .from("club_members")
          .select("*", { count: "exact", head: true })
          .eq("club_id", cid);

        if ((count ?? 0) < 3) {
          const result: WarDashboard = {
            war: null,
            no_club: false,
            club_too_small: true,
            no_match_found: false,
            is_debrief_day: false,
          };
          return Response.json(result);
        }

        const warId = await matchmakeClub(cid, weekBounds);
        if (warId) {
          const { data: w } = await supabaseAdmin
            .from("wars")
            .select("*")
            .eq("id", warId)
            .single();
          if (w) {
            activeWar = w;
            userClubId = cid;
            break;
          }
        }
      }
    }

    if (!activeWar) {
      const result: WarDashboard = {
        war: null,
        no_club: false,
        club_too_small: false,
        no_match_found: true,
        is_debrief_day: false,
      };
      return Response.json(result);
    }

    return Response.json(await buildWarDashboard(activeWar, profileId, false));
  } catch (err: any) {
    console.error("War current error:", err);
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}

// ——— Helper: build the full war dashboard response ———

async function buildWarDashboard(
  war: any,
  userId: string,
  isDebrief: boolean,
): Promise<WarDashboard> {
  // Determine which club is "mine"
  const { data: myMemberships } = await supabaseAdmin
    .from("club_members")
    .select("club_id")
    .eq("user_id", userId);

  const myClubIds = new Set((myMemberships || []).map((m: any) => m.club_id));
  const isClubA = myClubIds.has(war.club_a_id);
  const myClubId = isClubA ? war.club_a_id : war.club_b_id;
  const oppClubId = isClubA ? war.club_b_id : war.club_a_id;

  // Get club details
  const { data: myClub } = await supabaseAdmin
    .from("clubs")
    .select("id, name, logo_url")
    .eq("id", myClubId)
    .single();

  const { data: oppClub } = await supabaseAdmin
    .from("clubs")
    .select("id, name, logo_url")
    .eq("id", oppClubId)
    .single();

  // Get member counts
  const { count: myCount } = await supabaseAdmin
    .from("club_members")
    .select("*", { count: "exact", head: true })
    .eq("club_id", myClubId);

  const { count: oppCount } = await supabaseAdmin
    .from("club_members")
    .select("*", { count: "exact", head: true })
    .eq("club_id", oppClubId);

  // Get towers
  const { data: towers } = await supabaseAdmin
    .from("war_towers")
    .select("club_id, tower_type, current_value, target_value, is_winner")
    .eq("war_id", war.id);

  const getTower = (clubId: string, type: string) =>
    (towers || []).find(
      (t: any) => t.club_id === clubId && t.tower_type === type,
    ) || { current_value: 0, target_value: 1, is_winner: false };

  const buildTowerView = (type: string) => {
    const my = getTower(myClubId, type);
    const opp = getTower(oppClubId, type);
    return {
      my_progress: my.current_value,
      my_target: my.target_value,
      opp_progress: opp.current_value,
      opp_target: opp.target_value,
      my_winner: my.is_winner,
      opp_winner: opp.is_winner,
    };
  };

  // Count towers won
  const myTowersWon = ["roi", "montagne", "sprint"].filter(
    (tt) => getTower(myClubId, tt).is_winner,
  ).length;
  const oppTowersWon = ["roi", "montagne", "sprint"].filter(
    (tt) => getTower(oppClubId, tt).is_winner,
  ).length;

  // Get contributions for my club
  const { data: contribRows } = await supabaseAdmin
    .from("war_contributions")
    .select("user_id, km_contributed, dplus_contributed, sprints_contributed")
    .eq("war_id", war.id)
    .eq("club_id", myClubId)
    .order("km_contributed", { ascending: false });

  // Get usernames for contributors
  const contribUserIds = (contribRows || []).map((c: any) => c.user_id);
  const { data: contribProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", contribUserIds.length > 0 ? contribUserIds : ["none"]);

  const profileMap = new Map<string, { username: string; avatar_url: string | null }>();
  (contribProfiles || []).forEach((p: any) => {
    profileMap.set(p.id, { username: p.username, avatar_url: p.avatar_url });
  });

  const contributions: WarContribution[] = (contribRows || []).map((c: any) => ({
    user_id: c.user_id,
    username: profileMap.get(c.user_id)?.username ?? "Cycliste",
    avatar_url: profileMap.get(c.user_id)?.avatar_url ?? null,
    km_contributed: c.km_contributed,
    dplus_contributed: c.dplus_contributed,
    sprints_contributed: c.sprints_contributed,
  }));

  return {
    war: {
      id: war.id,
      week_label: war.week_label,
      starts_at: war.starts_at,
      ends_at: war.ends_at,
      status: war.status,
      my_club: {
        id: myClubId,
        name: myClub?.name ?? "Mon club",
        logo_url: myClub?.logo_url ?? null,
        member_count: myCount ?? 0,
      },
      opponent_club: {
        id: oppClubId,
        name: oppClub?.name ?? "Adversaire",
        logo_url: oppClub?.logo_url ?? null,
        member_count: oppCount ?? 0,
      },
      towers: {
        roi: buildTowerView("roi"),
        montagne: buildTowerView("montagne"),
        sprint: buildTowerView("sprint"),
      },
      my_club_towers_won: myTowersWon,
      opp_club_towers_won: oppTowersWon,
      contributions,
    },
    no_club: false,
    club_too_small: false,
    no_match_found: false,
    is_debrief_day: isDebrief,
  };
}
