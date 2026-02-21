"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useMotionSafe } from "@/hooks/useReducedMotion";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "card",
    title: "Ta VeloCard",
    description:
      "Voici ta carte de cycliste. Tes 6 stats sont calculées depuis tes sorties Strava. Roule pour les améliorer !",
  },
  {
    id: "stats",
    title: "Tes 6 Stats",
    description:
      "PAC (vitesse), END (endurance), MON (montagne), RES (puissance), SPR (sprint), VAL (technique). Chaque sortie les met à jour.",
  },
  {
    id: "tier",
    title: "Ton Tier",
    description:
      "Bronze \u2192 Argent \u2192 Platine \u2192 Diamant \u2192 Légende. Monte en améliorant ton OVR !",
  },
  {
    id: "duels",
    title: "Duels 1v1",
    description:
      "Défie d'autres cyclistes et mise tes ego points ! Instantané ou hebdomadaire.",
  },
  {
    id: "quests",
    title: "Quêtes du Jour",
    description:
      "Complète des micro-objectifs pour gagner des VeloCoins et des badges.",
  },
];

interface OnboardingTooltipProps {
  userId: string;
}

export default function OnboardingTooltip({ userId }: OnboardingTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { modalVariants, transition } = useMotionSafe();

  useEffect(() => {
    const completed = localStorage.getItem(`velocard-onboarding-${userId}`);
    if (!completed) {
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, [userId]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      localStorage.setItem(`velocard-onboarding-${userId}`, "true");
      setIsVisible(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`velocard-onboarding-${userId}`, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <AnimatePresence>
      <m.div
        key={step.id}
        role="dialog"
        aria-label="Tutoriel"
        initial={modalVariants.initial}
        animate={modalVariants.animate}
        exit={modalVariants.exit}
        transition={transition}
        className="fixed inset-0 z-[300] flex items-end justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={handleSkip} />

        {/* Tooltip */}
        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0F1729] p-5 shadow-2xl">
          {/* Progress dots */}
          <div className="mb-3 flex gap-1.5">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? "bg-[#00F5D4]" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <h4 className="mb-1 font-['Space_Grotesk'] text-lg font-bold text-white">
            {step.title}
          </h4>
          <p className="mb-4 text-sm text-white/60">{step.description}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-white/30 hover:text-white/50 focus-visible:outline-2 focus-visible:outline-[#00F5D4]"
            >
              Passer
            </button>
            <button
              onClick={handleNext}
              className="rounded-xl bg-[#00F5D4] px-5 py-2 text-sm font-bold text-[#0B1120] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {currentStep < ONBOARDING_STEPS.length - 1
                ? "Suivant"
                : "C'est parti !"}
            </button>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
