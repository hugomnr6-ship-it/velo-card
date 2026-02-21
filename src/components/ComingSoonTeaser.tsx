"use client";

import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";

interface ComingSoonTeaserProps {
  feature: string;
  icon?: string;
  description?: string;
}

/**
 * Teaser "Coming Soon" pour les features masquées au MVP.
 * Le code de la feature reste intact — on remplace juste la page.
 */
export default function ComingSoonTeaser({
  feature,
  icon = "🚧",
  description,
}: ComingSoonTeaserProps) {
  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<span className="text-2xl">{icon}</span>}
          title={feature}
        />

        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#1A1A2E]/80 to-[#111827]/80 p-8 text-center"
        >
          <div className="mx-auto mb-4 text-5xl opacity-60">{icon}</div>

          <h2 className="text-lg font-bold text-white">
            Bientôt disponible
          </h2>

          <p className="mt-2 text-sm text-[#94A3B8]">
            {description || `${feature} arrive prochainement. On y travaille !`}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#6366F1]/20 bg-[#6366F1]/10 px-4 py-2 text-xs font-semibold text-[#818CF8]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6366F1] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#818CF8]" />
            </span>
            En cours de développement
          </div>
        </m.div>
      </div>
    </AnimatedPage>
  );
}
