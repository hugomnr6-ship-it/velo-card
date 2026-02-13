"use client";

interface WarMatchupHeaderProps {
  myClubName: string;
  myClubLogo: string | null;
  oppClubName: string;
  oppClubLogo: string | null;
  myScore: number;
  oppScore: number;
  weekLabel: string;
  status: "active" | "finished";
  endsAt: string;
}

export default function WarMatchupHeader({
  myClubName,
  myClubLogo,
  oppClubName,
  oppClubLogo,
  myScore,
  oppScore,
  weekLabel,
  status,
  endsAt,
}: WarMatchupHeaderProps) {
  // Parse week number from "2026-W07"
  const weekNum = weekLabel.split("-W")[1] || weekLabel;

  // Time remaining
  const getTimeRemaining = () => {
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Terminé";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  const ClubBadge = ({
    name,
    logo,
    side,
  }: {
    name: string;
    logo: string | null;
    side: "left" | "right";
  }) => (
    <div
      className={`flex flex-col items-center gap-1.5 ${side === "right" ? "items-center" : "items-center"}`}
    >
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-700 bg-neutral-800">
        {logo ? (
          <img
            src={`/api/img?url=${encodeURIComponent(logo)}`}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl">🛡️</span>
        )}
      </div>
      <span className="max-w-[90px] truncate text-center text-xs font-medium text-neutral-300">
        {name}
      </span>
    </div>
  );

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      {/* Status badge */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <span
          className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            status === "active"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-neutral-700/50 text-neutral-400"
          }`}
        >
          {status === "active" ? "En cours" : "Terminé"}
        </span>
        <span className="text-[10px] text-neutral-500">
          Semaine {weekNum} {status === "active" && `· ${getTimeRemaining()}`}
        </span>
      </div>

      {/* Matchup */}
      <div className="flex items-center justify-center gap-4">
        <ClubBadge name={myClubName} logo={myClubLogo} side="left" />

        {/* Score */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span
              className={`text-3xl font-black ${myScore > oppScore ? "text-emerald-400" : "text-white"}`}
            >
              {myScore}
            </span>
            <span className="text-xl font-light text-neutral-600">—</span>
            <span
              className={`text-3xl font-black ${oppScore > myScore ? "text-red-400" : "text-white"}`}
            >
              {oppScore}
            </span>
          </div>
          <span className="mt-0.5 text-[10px] uppercase tracking-widest text-neutral-600">
            VS
          </span>
        </div>

        <ClubBadge name={oppClubName} logo={oppClubLogo} side="right" />
      </div>
    </div>
  );
}
