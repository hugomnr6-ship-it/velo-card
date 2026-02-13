"use client";

interface WarTowerBarProps {
  icon: string;
  label: string;
  unit: string;
  myProgress: number;
  oppProgress: number;
  target: number;
  myWinner: boolean;
  oppWinner: boolean;
  myClubName: string;
  oppClubName: string;
}

export default function WarTowerBar({
  icon,
  label,
  unit,
  myProgress,
  oppProgress,
  target,
  myWinner,
  oppWinner,
  myClubName,
  oppClubName,
}: WarTowerBarProps) {
  const myPct = Math.min((myProgress / target) * 100, 100);
  const oppPct = Math.min((oppProgress / target) * 100, 100);

  const formatValue = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <span className="text-xs text-neutral-500">
          Objectif : {formatValue(target)} {unit}
        </span>
      </div>

      {/* My club bar */}
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-emerald-400">
            {myClubName} {myWinner && "🏆"}
          </span>
          <span className="text-neutral-400">
            {formatValue(myProgress)} / {formatValue(target)} {unit} ({Math.round(myPct)}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              myWinner
                ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                : "bg-gradient-to-r from-emerald-600 to-emerald-400"
            }`}
            style={{ width: `${myPct}%` }}
          />
        </div>
      </div>

      {/* Opponent bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-red-400">
            {oppClubName} {oppWinner && "🏆"}
          </span>
          <span className="text-neutral-400">
            {formatValue(oppProgress)} / {formatValue(target)} {unit} ({Math.round(oppPct)}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              oppWinner
                ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                : "bg-gradient-to-r from-red-600 to-red-400"
            }`}
            style={{ width: `${oppPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
