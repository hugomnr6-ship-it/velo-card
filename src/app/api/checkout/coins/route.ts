import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { createCoinsCheckout } from "@/services/subscription.service";
import { COIN_PACKS } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { coinPackId } = await req.json();
    const pack = COIN_PACKS.find((p) => p.id === coinPackId);
    if (!pack) {
      return NextResponse.json({ error: "Pack invalide" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://velocard.app";
    const checkoutSession = await createCoinsCheckout(
      session.user.id,
      coinPackId,
      pack.priceId,
      `${origin}/shop?coins_success=true`,
      `${origin}/shop?coins_canceled=true`,
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    logger.error("[Coins Checkout] Error", { error: String(error) });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
