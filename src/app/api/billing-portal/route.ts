import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBillingPortal } from "@/services/subscription.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const origin = req.headers.get("origin") || "https://velocard.app";
    const portalSession = await createBillingPortal(
      session.user.id,
      `${origin}/settings`,
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
