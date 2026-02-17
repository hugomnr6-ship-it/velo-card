import { supabaseAdmin } from "@/lib/supabase";
import {
  getWarWeekBounds,
  matchmakeClub,
  finalizeExpiredWars,
} from "@/lib/wars";
import type { WarDashboard, WarContribution } from "@/types";

export async function getWarDashboardForUser(userId: string): Promise<WarDashboard> {
  // Get user's clubs
  const { data: memberships } = await supabaseAdmin
    .from("club_members")
    .select("club_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (!memberships || memberships.length === 0) {
    return {
      war: null,
      no_club: true,
      club_too_small: false,
      no_match_found: false,
      is_debrief_day: false,
    };
  }

  // Finalize any expired wars first
  await finalizeExpiredWars();

  const weekBounds = getWarWeekBounds();
  const isMonday = weekBounds === null;

  // If Monday (debrief), find last finished war for user's clubs
  if (isMonday) {
    const clubIds = memberships.map((m: any) => m.club_id);
    // Single query instead of N+1
    const { data: wars } = await supabaseAdmin
      .from("wars")
      .select("*")
      .eq("status", "finished")
      .or(clubIds.map((cid: string) => `club_a_id.eq.${cid},club_b_id.eq.${cid}`).join(","))
      .order("ends_at", { ascending: false })
      .limit(1);

    const lastWar = wars?.[0] ?? null;

    if (!lastWar) {
      return {
        war: null,
        no_club: false,
        club_too_small: false,
        no_match_found: false,
        is_debrief_day: true,
      };
    }

    return buildWarDashboard(lastWar, userId, true);
  }

  // Tuesday-Sunday: find or create active war
  let activeWar = null;

  for (const membership of memberships) {
    const cid = membership.club_id;

    const { data: existing } = await supabaseAdmin
      .from("wars")
      .select("*")
      .eq("week_label", weekBounds.week_label)
      .eq("status", "active")
      .or(`club_a_id.eq.${cid},club_b_id.eq.${cid}`)
      .single();

    if (existing) {
      activeWar = existing;
      break;
    }

    const { data: finished } = await supabaseAdmin
      .from("wars")
      .select("*")
      .eq("week_label", weekBounds.week_label)
      .eq("status", "finished")
      .or(`club_a_id.eq.${cid},club_b_id.eq.${cid}`)
      .single();

    if (finished) {
      activeWar = finished;
      break;
    }
  }

  // No war found, try matchmaking
  if (!activeWar) {
    for (const membership of memberships) {
      const cid = membership.club_id;

      const { count } = await supabaseAdmin
        .from("club_members")
        .select("*", { count: "exact", head: true })
        .eq("club_id", cid);

      if ((count ?? 0) < 3) {
        return {
          war: null,
          no_club: false,
          club_too_small: true,
          no_match_found: false,
          is_debrief_day: false,
        };
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
          break;
        }
      }
    }
  }

  if (!activeWar) {
    return {
      war: null,
      no_club: false,
      club_too_small: false,
      no_match_found: true,
      is_debrief_day: false,
    };
  }

  return buildWarDashboard(activeWar, userId, false);
}

/**
 * Get the war history for a club (last 10 wars with stats).
 */
export async function getWarHistory(clubId: string) {
  const { data: wars } = await supabaseAdmin
    .from("wars")
    .select("id, week_label, club_a_id, club_b_id, club_a_score, club_b_score, status, ends_at")
    .eq("status", "finished")
    .or(`club_a_id.eq.${clubId},club_b_id.eq.${clubId}`)
    .order("ends_at", { ascending: false })
    .limit(10);

  if (!wars || wars.length === 0) return { wars: [], wins: 0, losses: 0, draws: 0 };

  // Get opponent club names
  const opponentIds = wars.map((w: any) => w.club_a_id === clubId ? w.club_b_id : w.club_a_id);
  const { data: clubs } = await supabaseAdmin
    .from("clubs")
    .select("id, name, logo_url")
    .in("id", opponentIds);

  const clubMap = new Map((clubs || []).map((c: any) => [c.id, c]));

  let wins = 0;
  let losses = 0;
  let draws = 0;

  const history = wars.map((w: any) => {
    const isClubA = w.club_a_id === clubId;
    const myScore = isClubA ? w.club_a_score : w.club_b_score;
    const oppScore = isClubA ? w.club_b_score : w.club_a_score;
    const oppId = isClubA ? w.club_b_id : w.club_a_id;
    const opp = clubMap.get(oppId);

    const result = myScore > oppScore ? "win" : (oppScore > myScore ? "loss" : "draw");
    if (result === "win") wins++;
    else if (result === "loss") losses++;
    else draws++;

    return {
      war_id: w.id,
      week_label: w.week_label,
      opponent_name: opp?.name || "Club inconnu",
      opponent_logo_url: opp?.logo_url || null,
      my_score: myScore,
      opp_score: oppScore,
      result,
      ended_at: w.ends_at,
    };
  });

  return { wars: history, wins, losses, draws };
}

export async function buildWarDashboard(
  war: any,
  userId: string,
  isDebrief: boolean,
): Promise<WarDashboard> {
  const { data: myMemberships } = await supabaseAdmin
    .from("club_members")
    .select("club_id")
    .eq("user_id", userId);

  const myClubIds = new Set((myMemberships || []).map((m: any) => m.club_id));
  const isClubA = myClubIds.has(war.club_a_id);
  const myClubId = isClubA ? war.club_a_id : war.club_b_id;
  const oppClubId = isClubA ? war.club_b_id : war.club_a_id;

  // Parallelize club details + counts + towers
  const [myClubRes, oppClubRes, myCountRes, oppCountRes, towersRes] = await Promise.all([
    supabaseAdmin.from("clubs").select("id, name, logo_url").eq("id", myClubId).single(),
    supabaseAdmin.from("clubs").select("id, name, logo_url").eq("id", oppClubId).single(),
    supabaseAdmin.from("club_members").select("*", { count: "exact", head: true }).eq("club_id", myClubId),
    supabaseAdmin.from("club_members").select("*", { count: "exact", head: true }).eq("club_id", oppClubId),
    supabaseAdmin.from("war_towers").select("club_id, tower_type, current_value, target_value, is_winner").eq("war_id", war.id),
  ]);

  const myClub = myClubRes.data;
  const oppClub = oppClubRes.data;
  const myCount = myCountRes.count;
  const oppCount = oppCountRes.count;
  const towers = towersRes.data;

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
