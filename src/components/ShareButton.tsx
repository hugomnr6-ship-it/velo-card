"use client";

import { useState } from "react";
import ShareModal from "./ShareModal";
import type { CardTier } from "@/types";

interface ShareButtonProps {
  tier: CardTier;
  userId: string;
  className?: string;
}

export default function ShareButton({ tier, userId, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "mt-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        }
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Partager
        </span>
      </button>

      <ShareModal
        isOpen={open}
        onClose={() => setOpen(false)}
        tier={tier}
        userId={userId}
      />
    </>
  );
}
