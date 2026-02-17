import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserPro, getUserSubscription } from "@/services/subscription.service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const [isPro, subscription] = await Promise.all([
      isUserPro(session.user.id),
      getUserSubscription(session.user.id),
    ]);

    return NextResponse.json({
      isPro,
      plan: subscription?.plan || "free",
      status: subscription?.status || null,
      currentPeriodEnd: subscription?.current_period_end || null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      trialEnd: subscription?.trial_end || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
