import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isUserPro } from "@/services/subscription.service";

/**
 * Middleware helper: check if user is Pro.
 * Use in API routes that require Pro subscription.
 */
export async function requirePro(): Promise<{
  userId: string;
  isPro: true;
} | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const isPro = await isUserPro(session.user.id);
  if (!isPro) {
    return NextResponse.json(
      { error: "Abonnement Pro requis", upgradeUrl: "/pricing" },
      { status: 403 },
    );
  }

  return { userId: session.user.id, isPro: true };
}
