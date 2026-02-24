import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { createProCheckout } from "@/services/subscription.service";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { plan, returnPath } = await req.json();
    if (!["pro_monthly", "pro_yearly"].includes(plan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://velocard.app";
    // Rediriger vers la page d'origine après checkout (ou /pricing par défaut)
    const safePath = typeof returnPath === "string" && returnPath.startsWith("/") ? returnPath : "/pricing";
    const checkoutSession = await createProCheckout(
      session.user.id,
      plan,
      `${origin}${safePath}?success=true`,
      `${origin}${safePath}?canceled=true`,
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    logger.error("[Checkout] Error", { error: String(error) });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
