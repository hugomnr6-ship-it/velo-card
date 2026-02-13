"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { WarHistoryEntry } from "@/types";

export default function WarHistoryPage() {
  const { status } = useSession();
  const [history, setHistory] = useState<WarHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/wars/history");
        if (!res.ok) return;
        const json = await res.json();
        setHistory(json.history || []);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <h1 className="text-xl font-bold text-white">📜 Historique des guerres</h1>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 px-4 pb-24 pt-12">
      <h1 className="text-xl font-bold text-white">📜 Historique des guerres</h1>

      <Link
        href="/wars"
        className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
      >
        ← Retour à la guerre en cours
      </Link>

      {history.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <span className="text-3xl">🕰️</span>
          <p className="mt-2 text-sm text-neutral-400">
            Aucune guerre terminée pour le moment.
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-lg flex-col gap-2">
          {history.map((entry) => {
            const weekNum = entry.week_label.split("-W")[1] || entry.week_label;
            return (
              <div
                key={entry.war_id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  entry.result === "win"
                    ? "border-emerald-800/40 bg-emerald-950/20"
                    : entry.result === "loss"
                      ? "border-red-800/40 bg-red-950/10"
                      : "border-neutral-800 bg-neutral-900/40"
                }`}
              >
                {/* Result indicator */}
                <div className="text-xl">
                  {entry.result === "win"
                    ? "🏆"
                    : entry.result === "loss"
                      ? "😤"
                      : "🤝"}
                </div>

                {/* Opponent logo */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-800">
                  {entry.opponent_logo_url ? (
                    <img
                      src={`/api/img?url=${encodeURIComponent(entry.opponent_logo_url)}`}
                      alt={entry.opponent_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🛡️</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-200">
                    vs {entry.opponent_name}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Semaine {weekNum}
                  </p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-lg font-black ${
                      entry.result === "win" ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {entry.my_score}
                  </span>
                  <span className="text-xs text-neutral-600">-</span>
                  <span
                    className={`text-lg font-black ${
                      entry.result === "loss" ? "text-red-400" : "text-white"
                    }`}
                  >
                    {entry.opp_score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
