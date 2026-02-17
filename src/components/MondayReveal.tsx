"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import Confetti, { tierConfettiColors } from "./Confetti";
import ShareModal from "./ShareModal";
import { useCountUp } from "@/hooks/useCountUp";
import { useMotionSafe } from "@/hooks/useReducedMotion";
import type { ComputedStats, CardTier, StatDeltas, SpecialCardType } from "@/types";

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#E8A854",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

const tierLabel: Record<CardTier, string> = {
  bronze: "Bronze",
  argent: "Argent",
  platine: "Platine",
  diamant: "Diamant",
  legende: "Legende",
};

const STAT_META = [
  { key: "pac" as const, label: "VITESSE" },
  { key: "mon" as const, label: "MONTAGNE" },
  { key: "val" as const, label: "TECHNIQUE" },
  { key: "spr" as const, label: "SPRINT" },
  { key: "end" as const, label: "ENDURANCE" },
  { key: "res" as const, label: "PUISSANCE" },
];

interface MondayRevealProps {
  stats: ComputedStats;
  deltas: StatDeltas;
  tier: CardTier;
  previousTier: CardTier | null;
  specialCard: SpecialCardType | null;
  streak: number;
  username: string;
  avatarUrl: string | null;
  userId: string;
  onComplete: () => void;
}

/* ─── Animated stat value ─── */
function StatCountUp({ target, delay }: { target: number; delay: number }) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const count = useCountUp(started ? target : 0, 800);
  return <>{count}</>;
}

/* ─── OVR count up ─── */
function OvrCountUp({ target }: { target: number }) {
  const count = useCountUp(target, 2000);
  return <>{count}</>;
}

/* ─── Tier order for comparison ─── */
const tierOrder: CardTier[] = ["bronze", "argent", "platine", "diamant", "legende"];
function isTierUp(prev: CardTier, curr: CardTier): boolean {
  return tierOrder.indexOf(curr) > tierOrder.indexOf(prev);
}

export default function MondayReveal({
  stats,
  deltas,
  tier,
  previousTier,
  specialCard,
  streak,
  username,
  avatarUrl,
  userId,
  onComplete,
}: MondayRevealProps) {
  const { shouldReduce } = useMotionSafe();
  const [phase, setPhase] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Reduced motion: show results directly without 5-phase animation
  if (shouldReduce) {
    return (
      <>
        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            tier={tier}
            userId={userId}
          />
        )}
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-6"
          style={{ background: "#0A0A0F" }}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            {STAT_META.map((stat) => {
              const delta = deltas[stat.key];
              return (
                <div key={stat.key} className="flex flex-col items-center">
                  <span className="text-[10px] font-bold tracking-widest text-white/40">
                    {stat.label}
                  </span>
                  <span
                    className="text-3xl font-black font-['JetBrains_Mono']"
                    style={{ color: tierAccentHex[tier] }}
                  >
                    {stats[stat.key]}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      delta > 0
                        ? "text-[#22C55E]"
                        : delta < 0
                        ? "text-[#EF4444]"
                        : "text-white/20"
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta === 0 ? "-" : delta}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center">
            <span
              className="text-5xl font-black font-['JetBrains_Mono']"
              style={{ color: tierAccentHex[tier] }}
            >
              {stats.ovr}
            </span>
            <span
              className="text-xs font-bold tracking-widest"
              style={{ color: tierAccentHex[tier] }}
            >
              {tierLabel[tier]}
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onComplete}
              className="rounded-xl px-8 py-3 text-sm font-bold text-white"
              style={{ background: "#6366F1" }}
            >
              Voir mon dashboard
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white/70"
            >
              Partager ma carte
            </button>
          </div>
        </div>
      </>
    );
  }

  // Phase transitions
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1 → 2 after 2s
    timers.push(setTimeout(() => setPhase(2), 2000));

    // Phase 2 → 3: 6 stats * 600ms stagger + 800ms animation + buffer = ~5s
    timers.push(setTimeout(() => setPhase(3), 7000));

    // Phase 3 → 4 after 3s
    timers.push(setTimeout(() => setPhase(4), 10000));

    // Phase 4 → 5 after 3s
    timers.push(setTimeout(() => setPhase(5), 13000));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Trigger confetti on tier up in phase 4
  useEffect(() => {
    if (phase === 4 && previousTier && previousTier !== tier && isTierUp(previousTier, tier)) {
      setShowConfetti(true);
      if (!shouldReduce) navigator.vibrate?.([50, 30, 100]);
      const t = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(t);
    }
    if (phase === 3 && !shouldReduce) {
      navigator.vibrate?.(50);
    }
  }, [phase, previousTier, tier, shouldReduce]);

  // Allow dismiss after 3s in phase 5
  useEffect(() => {
    if (phase !== 5) return;
    const t = setTimeout(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest("button")) {
          onComplete();
        }
      };
      document.addEventListener("click", handleClick, { once: true });
      return () => document.removeEventListener("click", handleClick);
    }, 3000);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  const tierChanged = previousTier && previousTier !== tier;
  const tierUp = tierChanged && isTierUp(previousTier!, tier);

  return (
    <>
      <Confetti
        active={showConfetti}
        duration={3000}
        colors={tierConfettiColors[tier]}
        particleCount={60}
      />

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          tier={tier}
          userId={userId}
        />
      )}

      <m.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#0A0A0F" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, ${tierAccentHex[tier]}15 0%, transparent 60%)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-6">
          <AnimatePresence mode="wait">
            {/* ═══ PHASE 1 — Intro ═══ */}
            {phase === 1 && (
              <m.div
                key="phase1"
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="rounded-2xl px-8 py-4"
                  style={{
                    background: `radial-gradient(ellipse, ${tierAccentHex[tier]}10 0%, transparent 70%)`,
                  }}
                >
                  <p className="text-center text-lg font-semibold text-white/80">
                    Tes stats ont ete recalculees...
                  </p>
                </div>
              </m.div>
            )}

            {/* ═══ PHASE 2 — Stats reveal ═══ */}
            {phase === 2 && (
              <m.div
                key="phase2"
                className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.6 },
                  },
                }}
              >
                {STAT_META.map((stat, i) => {
                  const delta = deltas[stat.key];
                  return (
                    <m.div
                      key={stat.key}
                      className="flex flex-col items-center"
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: {
                          opacity: 1,
                          x: 0,
                          transition: { type: "spring", damping: 20 },
                        },
                      }}
                    >
                      <span className="text-[10px] font-bold tracking-widest text-white/40">
                        {stat.label}
                      </span>
                      <span
                        className="text-3xl font-black font-['JetBrains_Mono']"
                        style={{ color: tierAccentHex[tier] }}
                      >
                        <StatCountUp target={stats[stat.key]} delay={i * 600} />
                      </span>
                      <m.span
                        className={`text-sm font-bold ${
                          delta > 0
                            ? "text-[#22C55E]"
                            : delta < 0
                            ? "text-[#EF4444]"
                            : "text-white/20"
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.6 + 0.8 }}
                      >
                        {delta > 0 ? `+${delta}` : delta === 0 ? "-" : delta}
                      </m.span>
                    </m.div>
                  );
                })}
              </m.div>
            )}

            {/* ═══ PHASE 3 — OVR Reveal ═══ */}
            {phase === 3 && (
              <m.div
                key="phase3"
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <m.div
                  className="relative flex flex-col items-center"
                  animate={
                    deltas.ovr > 0
                      ? {
                          boxShadow: [
                            `0 0 0px ${tierAccentHex[tier]}00`,
                            `0 0 60px ${tierAccentHex[tier]}40`,
                            `0 0 0px ${tierAccentHex[tier]}00`,
                            `0 0 60px ${tierAccentHex[tier]}40`,
                            `0 0 0px ${tierAccentHex[tier]}00`,
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 2, ease: "easeInOut" }}
                  style={{ borderRadius: "50%" }}
                >
                  <span
                    className="text-[80px] font-black font-['JetBrains_Mono'] leading-none"
                    style={{ color: tierAccentHex[tier] }}
                  >
                    <OvrCountUp target={stats.ovr} />
                  </span>
                </m.div>
                <m.p
                  className={`mt-2 text-xl font-bold ${
                    deltas.ovr > 0
                      ? "text-[#22C55E]"
                      : deltas.ovr < 0
                      ? "text-[#EF4444]"
                      : "text-white/30"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                >
                  {deltas.ovr > 0 ? `+${deltas.ovr}` : deltas.ovr} OVR
                </m.p>
              </m.div>
            )}

            {/* ═══ PHASE 4 — Tier + Special Card ═══ */}
            {phase === 4 && (
              <m.div
                key="phase4"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* OVR small */}
                <span
                  className="text-5xl font-black font-['JetBrains_Mono']"
                  style={{ color: tierAccentHex[tier] }}
                >
                  {stats.ovr}
                </span>

                {/* Tier name */}
                <m.p
                  className="text-2xl font-black tracking-wider"
                  style={{ color: tierAccentHex[tier] }}
                  initial={{ scale: 1 }}
                  animate={tierUp ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {tierLabel[tier]}
                </m.p>

                {/* Tier change */}
                {tierChanged && tierUp && (
                  <m.div
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <span className="text-lg font-black text-[#FFD700]">
                      PROMOTION !
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{ color: tierAccentHex[previousTier!] }}>
                        {tierLabel[previousTier!]}
                      </span>
                      <m.span
                        className="text-white/60"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: 2, duration: 0.4 }}
                      >
                        &rarr;
                      </m.span>
                      <span style={{ color: tierAccentHex[tier] }}>
                        {tierLabel[tier]}
                      </span>
                    </div>
                  </m.div>
                )}

                {tierChanged && !tierUp && (
                  <m.p
                    className="text-sm text-[#EF4444]/70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Tier descendu
                  </m.p>
                )}

                {/* Special Card */}
                {specialCard && (
                  <m.div
                    className="mt-2 rounded-xl px-5 py-2.5 text-center font-bold"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, type: "spring", damping: 15 }}
                    style={{
                      background:
                        specialCard === "totw"
                          ? "linear-gradient(135deg, #10B98120, #10B98108)"
                          : specialCard === "in_form"
                          ? "linear-gradient(135deg, #F59E0B20, #EF444408)"
                          : "linear-gradient(135deg, #FFD70020, #FFA50008)",
                      border: `1px solid ${
                        specialCard === "totw"
                          ? "#10B98130"
                          : specialCard === "in_form"
                          ? "#F59E0B30"
                          : "#FFD70030"
                      }`,
                    }}
                  >
                    <span
                      className="text-sm"
                      style={{
                        color:
                          specialCard === "totw"
                            ? "#10B981"
                            : specialCard === "in_form"
                            ? "#F59E0B"
                            : "#FFD700",
                      }}
                    >
                      {specialCard === "totw" && "Echappee de la Semaine !"}
                      {specialCard === "in_form" && "En Forme !"}
                      {specialCard === "legend_moment" && "Moment de Legende !"}
                    </span>
                  </m.div>
                )}

                {/* Streak */}
                {streak > 1 && (
                  <m.p
                    className="mt-1 text-sm text-white/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {streak} semaines actives
                  </m.p>
                )}
              </m.div>
            )}

            {/* ═══ PHASE 5 — CTA ═══ */}
            {phase === 5 && (
              <m.div
                key="phase5"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Mini OVR recap */}
                <div className="mb-4 flex flex-col items-center">
                  <span
                    className="text-4xl font-black font-['JetBrains_Mono']"
                    style={{ color: tierAccentHex[tier] }}
                  >
                    {stats.ovr}
                  </span>
                  <span
                    className="text-xs font-bold tracking-widest"
                    style={{ color: tierAccentHex[tier] }}
                  >
                    {tierLabel[tier]}
                  </span>
                </div>

                <m.button
                  onClick={onComplete}
                  className="rounded-xl px-8 py-3 text-sm font-bold text-white transition"
                  style={{ background: "#6366F1" }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Voir mon dashboard
                </m.button>

                <m.button
                  onClick={() => setShowShareModal(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Partager ma carte
                </m.button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.div>
    </>
  );
}
