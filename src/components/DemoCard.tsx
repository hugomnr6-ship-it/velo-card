import type { CardTier } from "@/types";

/* ═══ Lightweight demo card for landing page — no hooks, no animations ═══ */

interface DemoCardProps {
  username: string;
  ovr: number;
  tier: CardTier;
  stats: { pac: number; mon: number; val: number; spr: number; end: number; res: number };
}

const tierAccent: Record<CardTier, string> = {
  bronze: "#E8A854",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

const tierBg: Record<CardTier, string> = {
  bronze: "linear-gradient(170deg, #1A1208, #241A0D 50%, #1A1208)",
  argent: "linear-gradient(170deg, #14101E, #1E1430 50%, #14101E)",
  platine: "linear-gradient(170deg, #101820, #1A2838 50%, #101820)",
  diamant: "linear-gradient(170deg, #041018, #0C2038 50%, #041018)",
  legende: "linear-gradient(170deg, #1A0A28, #2A1040 30%, #201808 60%, #1A0A28)",
};

const tierLabel: Record<CardTier, string> = {
  bronze: "BRONZE",
  argent: "ARGENT",
  platine: "PLATINE",
  diamant: "DIAMANT",
  legende: "LEGENDE",
};

const STAT_LABELS = [
  { key: "pac" as const, label: "VIT" },
  { key: "mon" as const, label: "MON" },
  { key: "val" as const, label: "TEC" },
  { key: "spr" as const, label: "SPR" },
  { key: "end" as const, label: "END" },
  { key: "res" as const, label: "PUI" },
];

export default function DemoCard({ username, ovr, tier, stats }: DemoCardProps) {
  const accent = tierAccent[tier];
  const bg = tierBg[tier];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 200,
        height: 290,
        background: bg,
        borderRadius: 16,
        border: `1px solid ${accent}30`,
        boxShadow: `0 0 40px ${accent}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Scan lines effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          borderRadius: 16,
        }}
      />

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-between p-3 pt-4">
        {/* Tier badge */}
        <div
          className="rounded-full px-3 py-0.5 text-[8px] font-black tracking-[0.2em]"
          style={{
            background: `linear-gradient(180deg, ${accent}, ${accent}80)`,
            color: "#0A0A0F",
          }}
        >
          {tierLabel[tier]}
        </div>

        {/* Avatar placeholder */}
        <div
          className="mt-2 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            border: `2px solid ${accent}50`,
            background: `${accent}10`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.6}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        {/* Username */}
        <p
          className="mt-1 text-[11px] font-bold"
          style={{ color: `${accent}cc` }}
        >
          {username}
        </p>

        {/* OVR */}
        <div className="flex flex-col items-center">
          <span
            className="text-[36px] font-black leading-none font-['JetBrains_Mono']"
            style={{ color: accent }}
          >
            {ovr}
          </span>
          <span
            className="text-[7px] font-bold tracking-[0.3em]"
            style={{ color: `${accent}60` }}
          >
            OVR
          </span>
        </div>

        {/* Stats grid */}
        <div className="mt-1 grid w-full grid-cols-3 gap-x-1 gap-y-0.5">
          {STAT_LABELS.map((s) => (
            <div key={s.key} className="flex flex-col items-center">
              <span className="text-[7px] font-bold text-white/25">{s.label}</span>
              <span
                className="text-[12px] font-black font-['JetBrains_Mono']"
                style={{ color: `${accent}bb` }}
              >
                {stats[s.key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
