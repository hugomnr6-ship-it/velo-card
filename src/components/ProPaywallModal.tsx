"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useMotionSafe } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useCheckout } from "@/hooks/useSubscription";
import { PLANS } from "@/lib/stripe-constants";
import { PRO_GATES } from "@/lib/pro-gates";
import { trackEvent } from "@/lib/analytics";

// Icônes par feature
const featureIcons: Record<string, string> = {
  stats: "📊",
  duels: "⚔️",
  leaderboard: "🏆",
  quests: "🎯",
  share: "📤",
  gpx: "🗺️",
  routes: "🗺️",
};

// Titres contextuels par feature
const featureTitles: Record<string, string> = {
  stats: "Stats en temps réel avec Pro",
  duels: "Duels illimités avec Pro",
  leaderboard: "Classement complet avec Pro",
  quests: "Quêtes illimitées avec Pro",
  share: "Partage sans watermark avec Pro",
  gpx: "Analyse complète avec Pro",
  routes: "Parcours illimités avec Pro",
};

interface ProPaywallModalProps {
  isOpen: boolean;
  feature: keyof typeof PRO_GATES;
  trigger?: string;
  onClose: () => void;
}

type BillingInterval = "monthly" | "yearly";

/**
 * Paywall modal style Strava.
 * Bottom-sheet sur mobile, card centrée sur desktop.
 * Checkout Stripe directement depuis le modal.
 */
export default function ProPaywallModal({
  isOpen,
  feature,
  trigger,
  onClose,
}: ProPaywallModalProps) {
  const [billing, setBilling] = useState<BillingInterval>("yearly");
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { shouldReduce } = useMotionSafe();
  const modalRef = useFocusTrap(isOpen, onClose);
  const checkout = useCheckout();
  const pathname = usePathname();

  const icon = featureIcons[feature] || "⭐";
  const title = featureTitles[feature] || "Passe à VeloCard Pro";
  const gate = PRO_GATES[feature];

  const plan = billing === "monthly" ? PLANS.PRO_MONTHLY : PLANS.PRO_YEARLY;
  const priceDisplay =
    billing === "monthly"
      ? `${PLANS.PRO_MONTHLY.price.toFixed(2).replace(".", ",")} €/mois`
      : `${PLANS.PRO_YEARLY.price.toFixed(2).replace(".", ",")} €/an`;
  const priceSubtext =
    billing === "yearly"
      ? `Soit ${(PLANS.PRO_YEARLY.price / 12).toFixed(2).replace(".", ",")} €/mois`
      : null;

  // Verrouiller le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Analytics : modal affiché
  useEffect(() => {
    if (isOpen) {
      trackEvent("pro_paywall_shown", { feature, trigger });
    }
  }, [isOpen, feature, trigger]);

  function handleToggle(interval: BillingInterval) {
    setBilling(interval);
    trackEvent("pro_paywall_toggle", { billing: interval });
  }

  function handleCheckout() {
    trackEvent("pro_paywall_checkout", { feature, billing });
    checkout.mutate({
      plan: billing === "monthly" ? "pro_monthly" : "pro_yearly",
      returnPath: pathname,
    });
  }

  function handleClose() {
    trackEvent("pro_paywall_dismissed", { feature });
    onClose();
  }

  // Animations
  const backdropAnim = shouldReduce
    ? { initial: {}, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  const mobileAnim = shouldReduce
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
      };

  const desktopAnim = shouldReduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 40, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 40, scale: 0.95 },
      };

  const modalAnim = isMobile ? mobileAnim : desktopAnim;
  const modalTransition = shouldReduce
    ? { duration: 0 }
    : { type: "spring" as const, damping: 30, stiffness: 300 };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            {...backdropAnim}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <m.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-title"
            {...modalAnim}
            transition={modalTransition}
            className={
              isMobile
                ? "fixed inset-x-0 bottom-0 z-[101] max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#111827] pb-[env(safe-area-inset-bottom)]"
                : "fixed inset-0 z-[101] m-auto flex h-fit max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-white/10 bg-[#111827]"
            }
            style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}
          >
            <div className="p-6">
              {/* Drag handle (mobile) */}
              {isMobile && (
                <div className="mb-4 flex justify-center">
                  <div className="h-1 w-10 rounded-full bg-white/20" />
                </div>
              )}

              {/* Bouton fermer */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleClose}
                  aria-label="Fermer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Icône + titre */}
              <div className="mb-2 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366F1]/10 text-3xl">
                  {icon}
                </div>
              </div>
              <h3
                id="paywall-title"
                className="mb-1 text-center font-['Space_Grotesk'] text-xl font-bold text-white"
              >
                {title}
              </h3>
              {trigger && (
                <p className="mb-4 text-center text-sm text-[#94A3B8]">
                  {trigger}
                </p>
              )}

              {/* Bénéfices Pro */}
              <div className="mb-6 space-y-2.5">
                {PLANS.PRO_MONTHLY.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#00F5D4]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-[#F8FAFC]">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Toggle Mensuel / Annuel */}
              <div className="mb-4 flex justify-center">
                <div className="flex rounded-xl bg-white/5 p-1">
                  <button
                    onClick={() => handleToggle("monthly")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      billing === "monthly"
                        ? "bg-[#6366F1] text-white shadow-md"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => handleToggle("yearly")}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      billing === "yearly"
                        ? "bg-[#6366F1] text-white shadow-md"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    Annuel
                    <span className="rounded-full bg-[#00F5D4]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#00F5D4]">
                      -{PLANS.PRO_YEARLY.savings}
                    </span>
                  </button>
                </div>
              </div>

              {/* Prix */}
              <div className="mb-2 text-center">
                <span className="font-['Space_Grotesk'] text-3xl font-bold text-white">
                  {priceDisplay}
                </span>
              </div>
              {priceSubtext && (
                <p className="mb-4 text-center text-xs text-[#94A3B8]">
                  {priceSubtext}
                </p>
              )}

              {/* Badge essai gratuit */}
              <div className="mb-5 flex justify-center">
                <span className="rounded-full border border-[#00F5D4]/20 bg-[#00F5D4]/10 px-3 py-1 text-[11px] font-bold text-[#00F5D4]">
                  7 jours d&apos;essai gratuit
                </span>
              </div>

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={checkout.isPending}
                className="mb-2 flex w-full items-center justify-center rounded-xl bg-[#6366F1] py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition hover:bg-[#6366F1]/80 disabled:opacity-60"
              >
                {checkout.isPending ? "Redirection..." : "Commencer l'essai gratuit"}
              </button>

              {/* Dismiss */}
              <button
                onClick={handleClose}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-[#64748B] transition hover:text-[#94A3B8]"
              >
                Plus tard
              </button>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
