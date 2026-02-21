import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBetaInfo, getBetaCount } from "@/services/beta.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const betaInfo = await getBetaInfo(session.user.id);
  const totalBetaTesters = await getBetaCount();

  return NextResponse.json({
    isBetaTester: !!betaInfo,
    betaNumber: betaInfo?.betaNumber || null,
    enrolledAt: betaInfo?.enrolledAt || null,
    totalBetaTesters,
    maxBetaTesters: 50,
    spotsLeft: 50 - totalBetaTesters,
  });
}
