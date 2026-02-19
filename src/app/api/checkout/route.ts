import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { createProCheckout } from "@/services/subscription.service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { plan } = await req.json();
    if (!["pro_monthly", "pro_yearly"].includes(plan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://velocard.app";
    const checkoutSession = await createProCheckout(
      session.user.id,
      plan,
      `${origin}/pricing?success=true`,
      `${origin}/pricing?canceled=true`,
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error("[Checkout Error]", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
