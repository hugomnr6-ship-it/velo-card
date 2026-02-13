"use client";

interface WarDebriefCardProps {
  myClubName: string;
  oppClubName: string;
  myScore: number;
  oppScore: number;
  weekLabel: string;
}

export default function WarDebriefCard({
  myClubName,
  oppClubName,
  myScore,
  oppScore,
  weekLabel,
}: WarDebriefCardProps) {
  const weekNum = weekLabel.split("-W")[1] || weekLabel;
  const isWin = myScore > oppScore;
  const isDraw = myScore === oppScore;

  return (
    <div
      className={`rounded-xl border p-5 text-center ${
        isWin
          ? "border-emerald-700/50 bg-emerald-950/30"
          : isDraw
            ? "border-neutral-700/50 bg-neutral-900/50"
            : "border-red-700/50 bg-red-950/20"
      }`}
    >
      <div className="mb-1 text-3xl">
        {isWin ? "🎉" : isDraw ? "🤝" : "😤"}
      </div>
      <h3
        className={`text-lg font-bold ${
          isWin ? "text-emerald-400" : isDraw ? "text-neutral-300" : "text-red-400"
        }`}
      >
        {isWin ? "VICTOIRE !" : isDraw ? "MATCH NUL" : "DÉFAITE"}
      </h3>
      <p className="mt-1 text-sm text-neutral-400">
        Semaine {weekNum} — {myClubName} vs {oppClubName}
      </p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span
          className={`text-2xl font-black ${isWin ? "text-emerald-400" : "text-white"}`}
        >
          {myScore}
        </span>
        <span className="text-neutral-600">—</span>
        <span
          className={`text-2xl font-black ${!isWin && !isDraw ? "text-red-400" : "text-white"}`}
        >
          {oppScore}
        </span>
      </div>
      <p className="mt-2 text-xs text-neutral-600">
        {isWin
          ? "Bravo ! Ton club a dominé cette semaine 💪"
          : isDraw
            ? "Égalité parfaite. La prochaine sera décisive !"
            : "On se relève et on revient plus fort mardi !"}
      </p>
    </div>
  );
}
