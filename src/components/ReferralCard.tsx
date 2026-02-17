"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/contexts/ToastContext";

export default function ReferralCard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ["referral"],
    queryFn: async () => {
      const res = await fetch("/api/referral");
      return res.json();
    },
  });

  const shareUrl = data?.code ? `https://velocard.app?ref=${data.code}` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast("Lien copié !", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Rejoin VeloCard !",
        text: `Crée ta carte de cycliste FIFA style ! Utilise mon code ${data?.code} pour recevoir 200 VeloCoins gratuits.`,
        url: shareUrl,
      });
    } else {
      handleCopy();
    }
  };

  if (!data?.code) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-2">Invite tes potes</h3>
      <p className="text-gray-400 text-sm mb-4">
        Toi : <strong className="text-yellow-400">500 VeloCoins</strong> par ami invité.
        Ton ami : <strong className="text-yellow-400">200 VeloCoins</strong> de bienvenue.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-gray-800 rounded-xl px-4 py-3 font-mono text-indigo-300 text-sm">
          {data.code}
        </div>
        <button
          onClick={handleCopy}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition"
        >
          {copied ? "Copié" : "Copier"}
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-semibold transition"
        >
          Partager
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span>{data.totalReferrals || 0} ami{(data.totalReferrals || 0) > 1 ? "s" : ""} invité{(data.totalReferrals || 0) > 1 ? "s" : ""}</span>
        <span aria-hidden="true">&bull;</span>
        <span className="text-yellow-400">{data.totalCoinsEarned || 0} coins gagnés</span>
      </div>
    </div>
  );
}
