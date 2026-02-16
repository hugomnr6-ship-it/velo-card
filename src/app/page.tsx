"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "🗺️",
    title: "Calendrier complet",
    desc: "Toutes les courses FFC, UFOLEP, FSGT. Cadets à DN1, filles et garçons.",
  },
  {
    icon: "🃏",
    title: "Ta carte FIFA",
    desc: "6 stats calculées automatiquement. 5 tiers de Bronze à Légende.",
  },
  {
    icon: "⚡",
    title: "Météo & parcours",
    desc: "Profil d'élévation, vent directionnel, passages difficiles. Tout en un tap.",
  },
  {
    icon: "⚔️",
    title: "Duels & classements",
    desc: "Défie tes rivaux, grimpe le classement régional, gagne des badges.",
  },
];

const providers = [
  {
    id: "strava",
    name: "Strava",
    color: "#FC4C02",
    hoverColor: "#e04400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
    ),
  },
  {
    id: "garmin",
    name: "Garmin",
    color: "#007CC3",
    hoverColor: "#006aab",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4zm0 1.2c-4.641 0-8.4 3.759-8.4 8.4s3.759 8.4 8.4 8.4 8.4-3.759 8.4-8.4-3.759-8.4-8.4-8.4zm0 2.4a6 6 0 110 12 6 6 0 010-12z" />
      </svg>
    ),
  },
  {
    id: "wahoo",
    name: "Wahoo",
    color: "#00B2E2",
    hoverColor: "#009cc8",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M2 12l4 8 4-6 2 4 4-10 4 6 2-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#0B1120]">
      {/* Background effects */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(0,245,212,0.05) 0%, transparent 40%), radial-gradient(ellipse at 80% 60%, rgba(236,72,153,0.04) 0%, transparent 40%)",
        }}
      />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-20 pb-12 text-center sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#6366F1]/20 bg-[#6366F1]/10 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-semibold text-[#6366F1]">
              Beta ouverte — Rejoins les premiers
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl">
            Velo
            <span className="bg-gradient-to-r from-[#6366F1] to-[#00F5D4] bg-clip-text text-transparent">
              Card
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base text-[#94A3B8] sm:text-lg">
            L&apos;app n°1 des cyclistes. Calendrier des courses, cartes FIFA,
            classements, météo — tout en un seul endroit.
          </p>
        </motion.div>

        {/* Auth buttons */}
        <motion.div
          className="mt-10 flex flex-col gap-3 w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (p.id === "strava") {
                  signIn("strava");
                } else {
                  // Garmin & Wahoo: Coming soon
                  alert(`Connexion ${p.name} bientôt disponible ! Pour le MVP, connecte-toi via Strava.`);
                }
              }}
              className="flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: p.color,
                boxShadow: `0 0 24px ${p.color}30`,
              }}
            >
              {p.icon}
              Se connecter avec {p.name}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Features grid */}
      <motion.div
        className="relative z-10 w-full max-w-lg px-6 pb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4 transition hover:border-[#6366F1]/20"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-2 text-sm font-bold text-white">{f.title}</h3>
              <p className="mt-1 text-xs text-[#64748B] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="relative z-10 pb-8 text-center">
        <p className="text-xs text-[#475569]">
          Gratuit pour commencer · Premium pour aller plus loin
        </p>
      </div>
    </main>
  );
}
