import { supabaseAdmin } from "./supabase";

// ——————————————————————————————————————————————
// Squad Wars — Core logic
// ——————————————————————————————————————————————

const MIN_MEMBERS = 3;

// ——— Sprint scoring with anti-descent filter ———

function getSprintPoints(activity: any): number {
  const maxSpeed = activity.max_speed || 0;
  if (maxSpeed < 13.89) return 0; // < 50 km/h → no sprint

  // Anti-descent filter: short ride with almost no D+ = probably a downhill
  const distKm = (activity.distance || 0) / 1000;
  const dplusPerKm = distKm > 0
    ? (activity.total_elevation_gain || 0) / distKm
    : 0;

  if (distKm < 10 && dplusPerKm < 1) return 0; // Pure descent → doesn't count

  return 1;
}

// ——— Week bounds ———

export interface WarWeekBounds {
  starts_at: string; // Tuesday 00:00 UTC
  ends_at: string; // Sunday 23:59 UTC
  week_label: string; // "2026-W07"
}

export function getWarWeekBounds(): WarWeekBounds | null {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue ... 6=Sat

  // Monday = debrief day, no active war period
  if (day === 1) return null;

  // Find the Tuesday of the current war week
  let diffToTuesday: number;
  if (day === 0) {
    // Sunday: war started 5 days ago (Tuesday)
    diffToTuesday = 5;
  } else {
    // Tue=0, Wed=1, Thu=2, Fri=3, Sat=4
    diffToTuesday = day - 2;
  }

  const tuesday = new Date(now);
  tuesday.setUTCDate(now.getUTCDate() - diffToTuesday);
  tuesday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(tuesday);
  sunday.setUTCDate(tuesday.getUTCDate() + 5);
  sunday.setUTCHours(23, 59, 59, 999);

  // ISO week number
  const yearStart = new Date(Date.UTC(tuesday.getUTCFullYear(), 0, 1));
  const dayOfYear =
    Math.floor(
      (tuesday.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  const weekNum = Math.ceil((dayOfYear + yearStart.getUTCDay()) / 7);
  const week_label = `${tuesday.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  return {
    starts_at: tuesday.toISOString(),
    ends_at: sunday.toISOString(),
    week_label,
  };
}

// ——— Tower target computation ———

interface TowerTargets {
  roi_km: number;
  montagne_dplus: number;
  sprint_count: number;
}

function computeTowerTargets(avgMembers: number): TowerTargets {
  return {
    roi_km: Math.round(avgMembers * 50), // 50 km per member
    montagne_dplus: Math.round(avgMembers * 500), // 500 m D+ per member
    sprint_count: Math.round(avgMembers * 2), // 2 sprints per member
  };
}

// ——— Compute contributions from strava_activities ———

interface ClubContributions {
  total_km: number;
  total_dplus: number;
  total_sprints: number;
  per_member: Map<
    string,
    { km: number; dplus: number; sprints: number; username: string; avatar_url: string | null }
  >;
}

async function computeClubContributions(
  clubId: string,
  startsAt: string,
  endsAt: string,
): Promise<ClubContributions> {
  // Get all members of this club
  const { data: members } = await supabaseAdmin
    .from("club_members")
    .select("user_id")
    .eq("club_id", clubId);

  if (!members || members.length === 0) {
    return { total_km: 0, total_dplus: 0, total_sprints: 0, per_member: new Map() };
  }

  const memberIds = members.map((m: any) => m.user_id);

  // Get profiles for usernames
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", memberIds);

  const profileMap = new Map<string, { username: string; avatar_url: string | null }>();
  (profiles || []).forEach((p: any) => {
    profileMap.set(p.id, { username: p.username, avatar_url: p.avatar_url });
  });

  // Query activities in the war period
  const { data: activities } = await supabaseAdmin
    .from("strava_activities")
    .select("user_id, distance, total_elevation_gain, max_speed")
    .in("user_id", memberIds)
    .eq("activity_type", "Ride")
    .gte("start_date", startsAt)
    .lte("start_date", endsAt);

  const per_member = new Map<
    string,
    { km: number; dplus: number; sprints: number; username: string; avatar_url: string | null }
  >();

  // Init all members (even those with 0 contribution)
  memberIds.forEach((uid: string) => {
    const p = profileMap.get(uid) || { username: "Cycliste", avatar_url: null };
    per_member.set(uid, { km: 0, dplus: 0, sprints: 0, ...p });
  });

  let total_km = 0;
  let total_dplus = 0;
  let total_sprints = 0;

  (activities || []).forEach((a: any) => {
    const km = (a.distance || 0) / 1000;
    const dplus = a.total_elevation_gain || 0;
    const sprintPts = getSprintPoints(a);

    total_km += km;
    total_dplus += dplus;
    total_sprints += sprintPts;

    const member = per_member.get(a.user_id);
    if (member) {
      member.km += km;
      member.dplus += dplus;
      member.sprints += sprintPts;
    }
  });

  return { total_km, total_dplus, total_sprints, per_member };
}

// ——— Matchmaking ———

async function getClubScore(clubId: string): Promise<{ score: number; memberCount: number }> {
  const { data: members } = await supabaseAdmin
    .from("club_members")
    .select("user_id")
    .eq("club_id", clubId);

  if (!members || members.length === 0) return { score: 0, memberCount: 0 };

  const memberIds = members.map((m: any) => m.user_id);

  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select('pac, "end", mon, ovr')
    .in("user_id", memberIds);

  if (!stats || stats.length === 0) return { score: 0, memberCount: members.length };

  const avgScore =
    stats.reduce((sum: number, s: any) => {
      return sum + (s.ovr || (s.pac + s.end + s.mon) / 3);
    }, 0) / stats.length;

  return { score: Math.round(avgScore), memberCount: members.length };
}

export async function matchmakeClub(
  clubId: string,
  weekBounds: WarWeekBounds,
): Promise<string | null> {
  // Check if club already has a war this week
  const { data: existingWar } = await supabaseAdmin
    .from("wars")
    .select("id")
    .eq("week_label", weekBounds.week_label)
    .or(`club_a_id.eq.${clubId},club_b_id.eq.${clubId}`)
    .single();

  if (existingWar) return existingWar.id;

  // Get club info
  const clubInfo = await getClubScore(clubId);
  if (clubInfo.memberCount < MIN_MEMBERS) return null;

  // Find all clubs with enough members
  const { data: allClubs } = await supabaseAdmin
    .from("clubs")
    .select("id")
    .neq("id", clubId);

  if (!allClubs || allClubs.length === 0) return null;

  // Get clubs already in a war this week
  const { data: warsThisWeek } = await supabaseAdmin
    .from("wars")
    .select("club_a_id, club_b_id")
    .eq("week_label", weekBounds.week_label);

  const clubsInWar = new Set<string>();
  (warsThisWeek || []).forEach((w: any) => {
    clubsInWar.add(w.club_a_id);
    clubsInWar.add(w.club_b_id);
  });

  // Score candidates
  const candidates: { id: string; score: number; memberCount: number; diff: number }[] = [];

  for (const c of allClubs) {
    if (clubsInWar.has(c.id)) continue;

    const info = await getClubScore(c.id);
    if (info.memberCount < MIN_MEMBERS) continue;

    candidates.push({
      id: c.id,
      score: info.score,
      memberCount: info.memberCount,
      diff: Math.abs(info.score - clubInfo.score),
    });
  }

  if (candidates.length === 0) return null;

  // Pick closest match
  candidates.sort((a, b) => a.diff - b.diff);
  const opponent = candidates[0];

  // Compute targets
  const avgMembers = (clubInfo.memberCount + opponent.memberCount) / 2;
  const targets = computeTowerTargets(avgMembers);

  // Insert the war
  const { data: war, error: warError } = await supabaseAdmin
    .from("wars")
    .insert({
      week_label: weekBounds.week_label,
      club_a_id: clubId,
      club_b_id: opponent.id,
      starts_at: weekBounds.starts_at,
      ends_at: weekBounds.ends_at,
    })
    .select("id")
    .single();

  if (warError) {
    // Race condition: another user already created this war
    // Re-fetch and return existing
    const { data: existing } = await supabaseAdmin
      .from("wars")
      .select("id")
      .eq("week_label", weekBounds.week_label)
      .or(`club_a_id.eq.${clubId},club_b_id.eq.${clubId}`)
      .single();
    return existing?.id ?? null;
  }

  // Insert 6 tower rows (3 per club)
  const towerTypes = ["roi", "montagne", "sprint"] as const;
  const towerRows = [clubId, opponent.id].flatMap((cid) =>
    towerTypes.map((t) => ({
      war_id: war.id,
      club_id: cid,
      tower_type: t,
      current_value: 0,
      target_value:
        t === "roi"
          ? targets.roi_km
          : t === "montagne"
            ? targets.montagne_dplus
            : targets.sprint_count,
    })),
  );

  await supabaseAdmin.from("war_towers").insert(towerRows);

  return war.id;
}

// ——— Finalize expired wars ———

export async function finalizeExpiredWars(): Promise<void> {
  const now = new Date().toISOString();

  const { data: expiredWars } = await supabaseAdmin
    .from("wars")
    .select("id, club_a_id, club_b_id")
    .eq("status", "active")
    .lt("ends_at", now);

  if (!expiredWars || expiredWars.length === 0) return;

  for (const war of expiredWars) {
    // Get tower progress for both clubs
    const { data: towers } = await supabaseAdmin
      .from("war_towers")
      .select("club_id, tower_type, current_value, target_value")
      .eq("war_id", war.id);

    if (!towers) continue;

    let scoreA = 0;
    let scoreB = 0;
    const towerWinners: { war_id: string; club_id: string; tower_type: string }[] = [];

    const towerTypes = ["roi", "montagne", "sprint"];
    for (const tt of towerTypes) {
      const towerA = towers.find(
        (t: any) => t.club_id === war.club_a_id && t.tower_type === tt,
      );
      const towerB = towers.find(
        (t: any) => t.club_id === war.club_b_id && t.tower_type === tt,
      );

      if (!towerA || !towerB) continue;

      const pctA = towerA.target_value > 0 ? towerA.current_value / towerA.target_value : 0;
      const pctB = towerB.target_value > 0 ? towerB.current_value / towerB.target_value : 0;

      if (pctA > pctB) {
        scoreA++;
        towerWinners.push({ war_id: war.id, club_id: war.club_a_id, tower_type: tt });
      } else if (pctB > pctA) {
        scoreB++;
        towerWinners.push({ war_id: war.id, club_id: war.club_b_id, tower_type: tt });
      }
      // Draw on a tower = no one gets the point
    }

    // Update tower winners
    for (const tw of towerWinners) {
      await supabaseAdmin
        .from("war_towers")
        .update({ is_winner: true })
        .eq("war_id", tw.war_id)
        .eq("club_id", tw.club_id)
        .eq("tower_type", tw.tower_type);
    }

    // Update war scores and status
    await supabaseAdmin
      .from("wars")
      .update({
        club_a_score: scoreA,
        club_b_score: scoreB,
        status: "finished",
      })
      .eq("id", war.id);
  }
}

// ——— Update war progress after a user syncs ———

export async function updateWarProgressForUser(userId: string): Promise<void> {
  const weekBounds = getWarWeekBounds();
  if (!weekBounds) return; // Monday = no active war

  // First, finalize any expired wars
  await finalizeExpiredWars();

  // Get all clubs the user belongs to
  const { data: memberships } = await supabaseAdmin
    .from("club_members")
    .select("club_id")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return;

  for (const membership of memberships) {
    const clubId = membership.club_id;

    // Find active war for this club
    const { data: war } = await supabaseAdmin
      .from("wars")
      .select("id, club_a_id, club_b_id, starts_at, ends_at")
      .eq("status", "active")
      .eq("week_label", weekBounds.week_label)
      .or(`club_a_id.eq.${clubId},club_b_id.eq.${clubId}`)
      .single();

    if (!war) continue;

    // Recompute contributions for BOTH clubs
    const clubs = [war.club_a_id, war.club_b_id];

    for (const cid of clubs) {
      const contributions = await computeClubContributions(
        cid,
        war.starts_at,
        war.ends_at,
      );

      // Upsert tower progress
      await supabaseAdmin
        .from("war_towers")
        .update({ current_value: Math.round(contributions.total_km * 10) / 10 })
        .eq("war_id", war.id)
        .eq("club_id", cid)
        .eq("tower_type", "roi");

      await supabaseAdmin
        .from("war_towers")
        .update({ current_value: Math.round(contributions.total_dplus) })
        .eq("war_id", war.id)
        .eq("club_id", cid)
        .eq("tower_type", "montagne");

      await supabaseAdmin
        .from("war_towers")
        .update({ current_value: contributions.total_sprints })
        .eq("war_id", war.id)
        .eq("club_id", cid)
        .eq("tower_type", "sprint");

      // Upsert per-member contributions
      for (const [uid, data] of contributions.per_member) {
        await supabaseAdmin.from("war_contributions").upsert(
          {
            war_id: war.id,
            club_id: cid,
            user_id: uid,
            km_contributed: Math.round(data.km * 10) / 10,
            dplus_contributed: Math.round(data.dplus),
            sprints_contributed: data.sprints,
            last_updated_at: new Date().toISOString(),
          },
          { onConflict: "war_id,club_id,user_id" },
        );
      }
    }

    // Check if any tower hit 100% → mark winner
    const { data: allTowers } = await supabaseAdmin
      .from("war_towers")
      .select("club_id, tower_type, current_value, target_value, is_winner")
      .eq("war_id", war.id);

    if (!allTowers) continue;

    let scoreA = 0;
    let scoreB = 0;

    for (const tt of ["roi", "montagne", "sprint"]) {
      const towerA = allTowers.find(
        (t: any) => t.club_id === war.club_a_id && t.tower_type === tt,
      );
      const towerB = allTowers.find(
        (t: any) => t.club_id === war.club_b_id && t.tower_type === tt,
      );

      if (!towerA || !towerB) continue;

      // First to reach 100% wins the tower
      const aFull = towerA.current_value >= towerA.target_value;
      const bFull = towerB.current_value >= towerB.target_value;

      if (aFull && !towerA.is_winner && !towerB.is_winner) {
        await supabaseAdmin
          .from("war_towers")
          .update({ is_winner: true })
          .eq("war_id", war.id)
          .eq("club_id", war.club_a_id)
          .eq("tower_type", tt);
        scoreA++;
      } else if (bFull && !towerA.is_winner && !towerB.is_winner) {
        await supabaseAdmin
          .from("war_towers")
          .update({ is_winner: true })
          .eq("war_id", war.id)
          .eq("club_id", war.club_b_id)
          .eq("tower_type", tt);
        scoreB++;
      } else if (towerA.is_winner) {
        scoreA++;
      } else if (towerB.is_winner) {
        scoreB++;
      }
    }

    // Update scores
    await supabaseAdmin
      .from("wars")
      .update({ club_a_score: scoreA, club_b_score: scoreB })
      .eq("id", war.id);

    // If one club has 2+ tower wins mid-week, finish the war early
    if (scoreA >= 2 || scoreB >= 2) {
      await supabaseAdmin
        .from("wars")
        .update({ status: "finished" })
        .eq("id", war.id);
    }
  }
}
