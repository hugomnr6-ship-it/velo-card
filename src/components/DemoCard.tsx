import type { CardTier } from "@/types";

/* ═══ Mini VeloCard for landing page — mirrors real card design ═══ */

interface DemoCardProps {
  username: string;
  ovr: number;
  tier: CardTier;
  stats: { pac: number; mon: number; val: number; spr: number; end: number; res: number };
}

/* ── Visual config per tier (matches VeloCard.tsx cardVisuals exactly) ── */
interface TierVisual {
  accent: string;
  bg: string;
  crestGrad: string;
  crestText: string;
  ringGrad: string;
  statColor: string;
  glow: string;
  border: string;
  divider: string;
  gaugeBg: string;
  shimmer: string;
  label: string;
}

const tierVisuals: Record<CardTier, TierVisual> = {
  bronze: {
    accent: "#E8A854",
    bg: "linear-gradient(170deg, #1A1208, #241A0D 50%, #1A1208)",
    crestGrad: "linear-gradient(180deg, #E8A854, #CD7F32)",
    crestText: "#1A1208",
    ringGrad: "linear-gradient(180deg, #E8A854, #8B6830)",
    statColor: "#E8A854",
    glow: "rgba(232,168,84,0.3)",
    border: "rgba(232,168,84,0.2)",
    divider: "rgba(232,168,84,0.2)",
    gaugeBg: "rgba(255,255,255,0.04)",
    shimmer: "rgba(232,168,84,0.1)",
    label: "BRONZE",
  },
  argent: {
    accent: "#B8A0D8",
    bg: "linear-gradient(170deg, #14101E, #1E1430 50%, #14101E)",
    crestGrad: "linear-gradient(180deg, #C8B0E8, #9880B8)",
    crestText: "#14101E",
    ringGrad: "linear-gradient(180deg, #C8B0E8, #8870A8)",
    statColor: "#D0C0E8",
    glow: "rgba(184,160,216,0.25)",
    border: "rgba(184,160,216,0.2)",
    divider: "rgba(184,160,216,0.2)",
    gaugeBg: "rgba(184,160,216,0.06)",
    shimmer: "rgba(184,160,216,0.14)",
    label: "ARGENT",
  },
  platine: {
    accent: "#E0E8F0",
    bg: "linear-gradient(170deg, #101820, #1A2838 50%, #101820)",
    crestGrad: "linear-gradient(180deg, #E0E8F0, #B0B8C8)",
    crestText: "#101820",
    ringGrad: "linear-gradient(180deg, #E0E8F0, #A8B4C4)",
    statColor: "#E0E8F0",
    glow: "rgba(224,232,240,0.3)",
    border: "rgba(224,232,240,0.18)",
    divider: "rgba(224,232,240,0.18)",
    gaugeBg: "rgba(224,232,240,0.05)",
    shimmer: "rgba(224,232,240,0.14)",
    label: "PLATINE",
  },
  diamant: {
    accent: "#00D4FF",
    bg: "linear-gradient(170deg, #041018, #0C2038 50%, #041018)",
    crestGrad: "linear-gradient(180deg, #00D4FF, #0088AA)",
    crestText: "#041018",
    ringGrad: "linear-gradient(180deg, #00D4FF, #0098CC)",
    statColor: "#00D4FF",
    glow: "rgba(0,212,255,0.35)",
    border: "rgba(0,212,255,0.22)",
    divider: "rgba(0,212,255,0.22)",
    gaugeBg: "rgba(0,212,255,0.06)",
    shimmer: "rgba(0,212,255,0.12)",
    label: "DIAMANT",
  },
  legende: {
    accent: "#FFD700",
    bg: "linear-gradient(170deg, #1A0A28, #2A1040 30%, #201808 60%, #1A0A28)",
    crestGrad: "linear-gradient(180deg, #FFD700, #FF9500)",
    crestText: "#1A0A28",
    ringGrad: "linear-gradient(180deg, #FFD700, #CC8800)",
    statColor: "#FFE44D",
    glow: "rgba(255,215,0,0.5)",
    border: "rgba(255,215,0,0.30)",
    divider: "rgba(255,215,0,0.30)",
    gaugeBg: "rgba(255,215,0,0.06)",
    shimmer: "rgba(255,215,0,0.18)",
    label: "LEGENDE",
  },
};

const STAT_LABELS = [
  { key: "pac" as const, label: "VIT" },
  { key: "mon" as const, label: "MON" },
  { key: "val" as const, label: "TEC" },
  { key: "spr" as const, label: "SPR" },
  { key: "end" as const, label: "END" },
  { key: "res" as const, label: "PUI" },
];

/* ── Mini circular gauge (SVG-based, no hooks) ── */
const CIRC = 2 * Math.PI * 18; // r=18

function MiniGauge({
  label,
  value,
  accent,
  statColor,
  glow,
  gaugeBg,
}: {
  label: string;
  value: number;
  accent: string;
  statColor: string;
  glow: string;
  gaugeBg: string;
}) {
  const offset = CIRC * (1 - value / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: "100%", aspectRatio: "1" }}>
        <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="20" cy="20" r="18" fill="none" stroke={gaugeBg} strokeWidth="2.5" />
          <circle
            cx="20" cy="20" r="18"
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 3px ${glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-['JetBrains_Mono'] font-extrabold leading-none"
            style={{ color: statColor, fontSize: "clamp(6px, 10cqw, 14px)" }}
          >
            {value}
          </span>
        </div>
      </div>
      <span
        className="font-bold text-white/25 leading-none"
        style={{ fontSize: "clamp(3px, 3cqw, 6px)", letterSpacing: "0.08em", marginTop: "1px" }}
      >
        {label}
      </span>
    </div>
  );
}

export default function DemoCard({ username, ovr, tier, stats }: DemoCardProps) {
  const v = tierVisuals[tier];

  return (
    <div className="w-full" style={{ containerType: "inline-size" }}>
      <div
        className="relative overflow-hidden w-full"
        style={{
          aspectRatio: "280 / 470",
          background: v.bg,
          borderRadius: "clamp(8px, 8cqw, 18px)",
          border: `1px solid ${v.accent}30`,
          boxShadow: `0 0 40px ${v.accent}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* ── Scan lines ── */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
            borderRadius: "inherit",
          }}
        />

        {/* ── Shimmer sweep ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: "inherit" }}>
          <div
            className="absolute -left-1/2 -top-1/2 h-[200%] w-[25%] rotate-[20deg]"
            style={{
              background: `linear-gradient(90deg, transparent, ${v.shimmer}, transparent)`,
              animation: "shimmer-sweep 5s ease-in-out infinite",
            }}
          />
        </div>

        {/* ── Spotlight ── */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(135deg, transparent 20%, ${v.accent}08 35%, rgba(255,255,255,0.10) 50%, ${v.accent}08 65%, transparent 80%)`,
            borderRadius: "inherit",
          }}
        />

        {/* ── Left & right vertical lines ── */}
        <div
          className="pointer-events-none absolute z-[3]"
          style={{
            left: "5%", top: "18%", bottom: "18%", width: 1,
            background: `linear-gradient(180deg, transparent, ${v.border}, transparent)`,
          }}
        />
        <div
          className="pointer-events-none absolute z-[3]"
          style={{
            right: "5%", top: "18%", bottom: "18%", width: 1,
            background: `linear-gradient(180deg, transparent, ${v.border}, transparent)`,
          }}
        />

        {/* ── CONTENT ── */}
        <div className="relative z-20 flex h-full flex-col items-center">

          {/* Crest — V-shaped shield at top */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: "-1px", width: "38%", aspectRatio: "100 / 46" }}
          >
            <div
              className="flex h-full w-full items-start justify-center"
              style={{
                clipPath: "polygon(0% 0%, 100% 0%, 85% 100%, 50% 80%, 15% 100%)",
                background: v.crestGrad,
                paddingTop: "14%",
              }}
            >
              <span
                className="font-['Space_Grotesk'] font-bold tracking-[0.3em]"
                style={{ color: v.crestText, fontSize: "clamp(3px, 2.5cqw, 7px)" }}
              >
                VELOCARD
              </span>
            </div>
          </div>

          {/* ── Top section ── */}
          <div className="flex flex-col items-center w-full" style={{ paddingTop: "18%" }}>

            {/* OVR score */}
            <div className="text-center" style={{ marginBottom: "2%" }}>
              <div
                className="font-['JetBrains_Mono'] font-extrabold leading-none"
                style={{
                  color: v.accent,
                  fontSize: "clamp(18px, 16cqw, 44px)",
                  textShadow: `0 0 25px ${v.glow}`,
                }}
              >
                {ovr}
              </div>
              <div
                className="font-bold tracking-[0.3em] text-white/20"
                style={{ fontSize: "clamp(3px, 2.5cqw, 7px)" }}
              >
                OVERALL
              </div>
            </div>

            {/* Hexagonal avatar with ring */}
            <div
              style={{
                width: "26%",
                aspectRatio: "1",
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: v.ringGrad,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: `drop-shadow(0 0 10px ${v.glow})`,
              }}
            >
              <div
                style={{
                  width: "90%",
                  aspectRatio: "1",
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  background: "#0E1828",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  className="font-['Space_Grotesk'] font-extrabold"
                  style={{ color: v.accent, fontSize: "clamp(10px, 8cqw, 24px)" }}
                >
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Username */}
            <div
              className="font-['Space_Grotesk'] font-bold text-[#F8FAFC] max-w-[85%] truncate text-center"
              style={{ fontSize: "clamp(6px, 5.5cqw, 15px)", marginTop: "3%" }}
            >
              {username}
            </div>

            {/* Tier label */}
            <div
              className="font-bold tracking-[0.25em]"
              style={{ color: v.accent, opacity: 0.4, fontSize: "clamp(3px, 3cqw, 8px)", marginTop: "1%" }}
            >
              {v.label}
            </div>

            {/* Divider */}
            <div
              className="mx-auto"
              style={{
                width: "50%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${v.divider}, transparent)`,
                marginTop: "4%",
                marginBottom: "3%",
              }}
            />
          </div>

          {/* ── Circular Gauges 3×2 ── */}
          <div
            className="grid w-full grid-cols-3"
            style={{ gap: "clamp(1px, 1.5cqw, 4px)", paddingLeft: "8%", paddingRight: "8%" }}
          >
            {STAT_LABELS.map((s) => (
              <MiniGauge
                key={s.key}
                label={s.label}
                value={stats[s.key]}
                accent={v.accent}
                statColor={v.statColor}
                glow={v.glow}
                gaugeBg={v.gaugeBg}
              />
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer divider */}
          <div
            className="mx-auto"
            style={{
              width: "50%",
              height: 1,
              background: `linear-gradient(90deg, transparent, ${v.divider}, transparent)`,
              opacity: 0.5,
              marginBottom: "1%",
            }}
          />
          <div
            className="flex items-center justify-center gap-2"
            style={{ marginBottom: "1%" }}
          >
            <span
              className="truncate max-w-[90px] font-['JetBrains_Mono'] font-semibold uppercase"
              style={{ fontSize: "clamp(3px, 3cqw, 9px)", letterSpacing: "0.08em", color: `${v.accent}90` }}
            >
              CC Vélo Sprint
            </span>
            <span style={{ fontSize: "clamp(2px, 2cqw, 6px)", color: `${v.accent}40` }}>&#9670;</span>
            <div className="flex items-center gap-1">
              <div
                className="rounded-[2px] overflow-hidden"
                style={{
                  width: 14, height: 10,
                  background: "linear-gradient(90deg, #002395 0% 33%, #fff 33% 66%, #ED2939 66% 100%)",
                  boxShadow: `0 0 0 0.5px ${v.accent}20, 0 1px 2px rgba(0,0,0,0.3)`,
                }}
              />
              <span
                className="font-['JetBrains_Mono'] font-medium uppercase"
                style={{ fontSize: "clamp(3px, 3cqw, 9px)", letterSpacing: "0.06em", color: `${v.accent}70` }}
              >
                FR
              </span>
            </div>
          </div>
          <div
            className="tracking-[0.2em] text-white/[0.08]"
            style={{ fontSize: "clamp(3px, 2.5cqw, 7px)", paddingBottom: "4%" }}
          >
            VELOCARD.APP
          </div>
        </div>
      </div>
    </div>
  );
}
