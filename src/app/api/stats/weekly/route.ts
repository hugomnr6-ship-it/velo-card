import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * GET /api/stats/weekly
 * Returns real-time weekly stats calculated from cached strava_activities.
 * Unlike /api/users/[userId] which returns Monday Update snapshot values,
 * this endpoint calculates from actual activity data for the current week.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  try {
    // Calculate Monday 00:00 UTC for the current week
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=dim, 1=lun, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);

    // Fetch activities for the current week
    const { data: activities } = await supabaseAdmin
      .from("strava_activities")
      .select("distance, total_elevation_gain, moving_time, activity_type")
      .eq("user_id", session.user.id)
      .gte("start_date", monday.toISOString())
      .in("activity_type", ["Ride", "VirtualRide"]);

    if (!activities || activities.length === 0) {
      return NextResponse.json({ km: 0, dplus: 0, rides: 0, time: 0 });
    }

    const km = activities.reduce((sum, a) => sum + (a.distance || 0) / 1000, 0);
    const dplus = activities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
    const rides = activities.length;
    const time = activities.reduce((sum, a) => sum + (a.moving_time || 0), 0);

    return NextResponse.json({
      km: Math.round(km * 10) / 10,
      dplus: Math.round(dplus),
      rides,
      time, // in seconds
    });
  } catch (err: any) {
    console.error("[WEEKLY STATS] Error:", err);
    return NextResponse.json({ km: 0, dplus: 0, rides: 0, time: 0 });
  }
}
