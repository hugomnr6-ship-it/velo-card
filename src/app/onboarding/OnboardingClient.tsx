"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";
import VeloCard from "@/components/VeloCard";
import type { ComputedStats, CardTier, Badge } from "@/types";

/* ════════════════════════════════════════
   ONBOARDING — 4 Phases
   1. Sync animation
   2. Card reveal (pack opening)
   3. Explanation slides
   4. CTA
   ════════════════════════════════════════ */

interface Props {
  userName: string;
  userImage: string | null;
  accessToken: string;
}

interface SyncResult {
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  avatarUrl: string | null;
}

/* ═══ Phase 1: Sync ═══ */
function SyncPhase({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Pulsing icon */}
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00F5D4]">
              <path d="M12 2L12 6M12 18L12 22M6 12L2 12M22 12L18 12" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </motion.div>
        </div>
        {/* Rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "#00F5D4",
            borderRightColor: "rgba(0,245,212,0.3)",
          }}
        />
      </div>

      <div className="text-center">
        <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
          Analyse de tes sorties...
        </h2>
        <p className="mt-2 text-sm text-white/40">
          Connexion avec Strava en cours
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #00F5D4, #6366F1)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="mt-2 text-center font-['JetBrains_Mono'] text-xs text-white/30">
          {progress}%
        </p>
      </div>
    </motion.div>
  );
}

/* ═══ Phase 2: Card Reveal ═══ */
function CardRevealPhase({
  userName,
  avatarUrl,
  stats,
  tier,
  badges,
}: {
  userName: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-6"
    >
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-['Space_Grotesk'] text-xl font-bold text-white"
      >
        Ta carte est prete !
      </motion.h2>

      {/* Pack opening container */}
      <div className="relative">
        {/* Particles burst */}
        <AnimatePresence>
          {revealed && (
            <>
              {Array.from({ length: 20 }).map((_, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const distance = 80 + Math.random() * 60;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
                    style={{
                      background: i % 3 === 0 ? "#00F5D4" : i % 3 === 1 ? "#6366F1" : "#FFD700",
                      marginLeft: -4,
                      marginTop: -4,
                    }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Card with reveal animation */}
        <motion.div
          initial={{ scale: 0.3, rotateY: 180, opacity: 0 }}
          animate={
            revealed
              ? { scale: 1, rotateY: 0, opacity: 1 }
              : { scale: 0.3, rotateY: 180, opacity: 0 }
          }
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.3,
          }}
        >
          <VeloCard
            username={userName}
            avatarUrl={avatarUrl}
            stats={stats}
            tier={tier}
            badges={badges}
          />
        </motion.div>
      </div>

      {/* Tier label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="text-center"
      >
        <p className="text-sm text-white/50">
          Tu commences avec le tier
        </p>
        <p className="mt-1 font-['Space_Grotesk'] text-lg font-bold uppercase" style={{
          color: tier === "bronze" ? "#E8A854" : tier === "argent" ? "#B8A0D8" : tier === "platine" ? "#E0E8F0" : tier === "diamant" ? "#00D4FF" : "#FFD700",
        }}>
          {tier}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ═══ Phase 3: Explanation Slides ═══ */
const slides = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00F5D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 12h10M12 7v10" />
      </svg>
    ),
    title: "6 stats, 1 score global",
    desc: "VIT, MON, TEC, SPR, END, PUI — chaque stat reflette ton style de cycliste. Ton OVR les combine toutes.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    title: "Monte de tier chaque semaine",
    desc: "Bronze, Argent, Platine, Diamant, Legende — continue de rouler pour atteindre le sommet.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Defie tes amis",
    desc: "Duels, clubs, classements, courses — prouve que tu es le plus fort sur chaque stat.",
  },
];

function SlidesPhase({
  currentSlide,
  onNext,
}: {
  currentSlide: number;
  onNext: () => void;
}) {
  const slide = slides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-8"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            {slide.icon}
          </div>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
            {slide.title}
          </h2>
          <p className="max-w-[280px] text-sm leading-relaxed text-white/50">
            {slide.desc}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex gap-2">
        {slides.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === currentSlide ? 24 : 8,
              background: i === currentSlide ? "#00F5D4" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      <button
        onClick={onNext}
        className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
        style={{
          background: "linear-gradient(135deg, #00F5D4, #6366F1)",
        }}
      >
        {currentSlide < slides.length - 1 ? "Suivant" : "C'est parti !"}
      </button>
    </motion.div>
  );
}

/* ═══ Phase 4: CTA ═══ */
function CtaPhase({ onDashboard }: { onDashboard: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <div className="text-4xl">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00F5D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      </div>
      <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">
        Tu es pret !
      </h2>
      <p className="max-w-[280px] text-sm text-white/50">
        Ta carte VeloCard est generee. Explore ton dashboard, defie des amis, et monte de tier !
      </p>
      <button
        onClick={onDashboard}
        className="rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110"
        style={{
          background: "linear-gradient(135deg, #00F5D4, #6366F1)",
        }}
      >
        Voir mon dashboard
      </button>
    </motion.div>
  );
}

/* ═══ MAIN ONBOARDING COMPONENT ═══ */
export default function OnboardingClient({ userName, userImage, accessToken }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  // Phase 1: Run sync
  useEffect(() => {
    let cancelled = false;

    async function runSync() {
      // Simulate progress while sync runs
      const interval = setInterval(() => {
        setSyncProgress((p) => {
          if (p >= 90) return p;
          return p + Math.random() * 15;
        });
      }, 400);

      try {
        const res = await fetch("/api/strava/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!cancelled) {
          clearInterval(interval);
          setSyncProgress(100);

          if (res.ok) {
            const data = await res.json();
            setSyncResult({
              stats: data.stats || { pac: 40, end: 35, mon: 30, res: 25, spr: 20, val: 45, ovr: 33 },
              tier: data.tier || "bronze",
              badges: data.badges || [],
              avatarUrl: userImage,
            });
          } else {
            // Fallback: proceed with default values
            setSyncResult({
              stats: { pac: 40, end: 35, mon: 30, res: 25, spr: 20, val: 45, ovr: 33 },
              tier: "bronze",
              badges: [],
              avatarUrl: userImage,
            });
          }

          // Delay before card reveal
          setTimeout(() => {
            if (!cancelled) setPhase(2);
          }, 800);
        }
      } catch {
        if (!cancelled) {
          clearInterval(interval);
          setSyncProgress(100);
          setSyncResult({
            stats: { pac: 40, end: 35, mon: 30, res: 25, spr: 20, val: 45, ovr: 33 },
            tier: "bronze",
            badges: [],
            avatarUrl: userImage,
          });
          setTimeout(() => {
            if (!cancelled) setPhase(2);
          }, 800);
        }
      }
    }

    runSync();
    return () => { cancelled = true; };
  }, [userImage]);

  // Handle slide navigation
  const handleNextSlide = useCallback(() => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex((i) => i + 1);
    } else {
      setPhase(4);
    }
  }, [slideIndex]);

  // Handle go to dashboard
  const handleDashboard = useCallback(async () => {
    // Mark onboarding as complete
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // Non-blocking — continue to dashboard regardless
    }
    router.push("/dashboard");
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(0,245,212,0.08) 0%, rgba(99,102,241,0.04) 40%, transparent 80%)",
        }}
      />

      <AnimatePresence mode="wait">
        {phase === 1 && (
          <SyncPhase key="sync" progress={Math.round(syncProgress)} />
        )}
        {phase === 2 && syncResult && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CardRevealPhase
              userName={userName}
              avatarUrl={syncResult.avatarUrl}
              stats={syncResult.stats}
              tier={syncResult.tier}
              badges={syncResult.badges}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="mt-6 flex justify-center"
            >
              <button
                onClick={() => setPhase(3)}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white/70 transition-all hover:text-white"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                Continuer
              </button>
            </motion.div>
          </motion.div>
        )}
        {phase === 3 && (
          <SlidesPhase
            key="slides"
            currentSlide={slideIndex}
            onNext={handleNextSlide}
          />
        )}
        {phase === 4 && (
          <CtaPhase key="cta" onDashboard={handleDashboard} />
        )}
      </AnimatePresence>
    </main>
  );
}
