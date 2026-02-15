"use client";

import ShareButton from "@/components/ShareButton";
import type { CardTier } from "@/types";

export default function ShareButtonWrapper({ tier, userId }: { tier: CardTier; userId: string }) {
  return <ShareButton tier={tier} userId={userId} />;
}
