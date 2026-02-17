'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';

interface FeatureTooltipProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function FeatureTooltip({ id, title, description, children, position = 'bottom' }: FeatureTooltipProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(`tooltip_${id}`);
    if (!seen) setDismissed(false);
  }, [id]);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(`tooltip_${id}`, 'true');
  };

  const positionClasses = {
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {!dismissed && (
          <m.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={`absolute z-50 w-64 bg-accent text-bg-primary rounded-xl p-3 shadow-xl ${positionClasses[position]}`}
            role="tooltip"
          >
            <button
              onClick={dismiss}
              className="absolute top-2 right-2 opacity-70 hover:opacity-100"
              aria-label="Fermer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs opacity-80 mt-1">{description}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
