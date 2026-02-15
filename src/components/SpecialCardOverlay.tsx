"use client";

import type { SpecialCardType } from "@/types";
import { IconStar, IconFire, IconTrophy } from "@/components/icons/VeloIcons";

interface SpecialCardOverlayProps {
  type: SpecialCardType;
}

/**
 * Visual overlay for special cards (L'Échappée, In-Form, Legend Moment).
 * Renders on top of the base VeloCard to add the special visual treatment.
 */
export default function SpecialCardOverlay({ type }: SpecialCardOverlayProps) {
  if (type === "totw") return <TOTWOverlay />;
  if (type === "in_form") return <InFormOverlay />;
  if (type === "legend_moment") return <LegendMomentOverlay />;
  return null;
}

/* ——— L'ÉCHAPPÉE DE LA SEMAINE — Black & Gold Premium ——— */
function TOTWOverlay() {
  return (
    <>
      {/* Dark vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[25] rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      {/* Gold border glow */}
      <div
        className="pointer-events-none absolute inset-0 z-[26] rounded-2xl"
        style={{
          boxShadow: "inset 0 0 30px rgba(255,215,0,0.15), 0 0 40px rgba(255,215,0,0.1)",
        }}
      />
      {/* Échappée badge — top center */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-[28] -translate-x-1/2 -translate-y-1/2">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
            border: "1.5px solid rgba(255,215,0,0.6)",
            boxShadow: "0 4px 20px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <IconStar size={14} className="text-[#FFD700]" />
          <span className="text-[10px] font-black tracking-[0.2em] text-[#FFD700]">
            ÉCHAPPÉE
          </span>
        </div>
      </div>
      {/* Gold particle rain */}
      <div className="pointer-events-none absolute inset-0 z-[24] overflow-hidden rounded-2xl">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              background: "#FFD700",
              borderRadius: "50%",
              opacity: 0.3 + Math.random() * 0.4,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ——— IN FORM — Fire & Orange Energy ——— */
function InFormOverlay() {
  return (
    <>
      {/* Fire gradient border */}
      <div
        className="pointer-events-none absolute inset-0 z-[25] rounded-2xl"
        style={{
          boxShadow: "inset 0 0 30px rgba(255,107,53,0.15), 0 0 40px rgba(255,107,53,0.08)",
        }}
      />
      {/* Bottom fire glow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[24] h-1/3 rounded-b-2xl"
        style={{
          background: "linear-gradient(to top, rgba(255,80,0,0.12) 0%, transparent 100%)",
        }}
      />
      {/* IF badge */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-[28] -translate-x-1/2 -translate-y-1/2">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: "linear-gradient(135deg, #2d1208 0%, #1a0a02 100%)",
            border: "1.5px solid rgba(255,107,53,0.6)",
            boxShadow: "0 4px 20px rgba(255,107,53,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <IconFire size={14} className="text-[#FF6B35]" />
          <span className="text-[10px] font-black tracking-[0.2em] text-[#FF6B35]">
            IN FORM
          </span>
        </div>
      </div>
      {/* Ember particles rising */}
      <div className="pointer-events-none absolute inset-0 z-[24] overflow-hidden rounded-2xl">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="particle absolute"
            style={{
              "--left": `${20 + Math.random() * 60}%`,
              "--delay": `${Math.random() * 4}s`,
              "--duration": `${2 + Math.random() * 3}s`,
              background: `hsl(${20 + Math.random() * 20}, 100%, ${50 + Math.random() * 20}%)`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              borderRadius: "50%",
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
}

/* ——— LEGEND MOMENT — Cosmic / Rainbow ——— */
function LegendMomentOverlay() {
  return (
    <>
      {/* Rainbow shimmer */}
      <div
        className="pointer-events-none absolute inset-0 z-[25] rounded-2xl rainbow-holo"
        style={{ opacity: 0.15 }}
      />
      {/* Trophy badge */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-[28] -translate-x-1/2 -translate-y-1/2">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: "linear-gradient(135deg, #0a1628 0%, #162040 100%)",
            border: "1.5px solid rgba(185,242,255,0.6)",
            boxShadow: "0 4px 20px rgba(185,242,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <IconTrophy size={14} className="text-[#B9F2FF]" />
          <span className="text-[10px] font-black tracking-[0.2em] text-[#B9F2FF]">
            LÉGENDE
          </span>
        </div>
      </div>
    </>
  );
}
