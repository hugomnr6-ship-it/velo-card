import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Check if user is admin (simple check — you can enhance this)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (!profile?.is_admin) {
      return Response.json({ error: "Accès interdit" }, { status: 403 });
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [dau, wau, mau, duelsToday, packsToday, proUsers, totalRevenue] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", dayAgo),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", weekAgo),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", monthAgo),
      supabaseAdmin.from("duels").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
      supabaseAdmin.from("user_inventory").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("payments").select("amount").eq("status", "succeeded"),
    ]);

    const mrr = totalRevenue.data?.reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0) || 0;

    return Response.json({
      dau: dau.count || 0,
      wau: wau.count || 0,
      mau: mau.count || 0,
      duelsPerDay: duelsToday.count || 0,
      packsOpenedPerDay: packsToday.count || 0,
      proUsers: proUsers.count || 0,
      totalRevenueCents: mrr,
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    return handleApiError(err, "ADMIN_METRICS");
  }
}
