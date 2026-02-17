"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";

interface FeatureDiscoveryProps {
  featureId: string;
  title: string;
  description: string;
  icon: string;
}

export default function FeatureDiscovery({
  featureId,
  title,
  description,
  icon,
}: FeatureDiscoveryProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(`velocard-feature-${featureId}`);
    if (!seen) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, [featureId]);

  const dismiss = () => {
    localStorage.setItem(`velocard-feature-${featureId}`, "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-4 right-4 z-[150] mx-auto max-w-sm"
        >
          <button
            onClick={dismiss}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#00F5D4]/20 bg-[#0F1729]/95 p-4 shadow-2xl backdrop-blur-xl text-left"
          >
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-wider text-[#00F5D4]">
                NOUVEAU
              </p>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-white/50">{description}</p>
            </div>
            <span className="text-white/30 text-xs">{"\u2715"}</span>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
