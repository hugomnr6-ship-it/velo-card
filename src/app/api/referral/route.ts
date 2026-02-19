import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getReferralCode, getReferralStats, applyReferralCode } from "@/services/referral.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const [referralCode, stats] = await Promise.all([
      getReferralCode(session.user.id),
      getReferralStats(session.user.id),
    ]);

    return NextResponse.json({ code: referralCode, ...stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const result = await applyReferralCode(session.user.id, code);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
