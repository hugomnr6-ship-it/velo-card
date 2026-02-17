"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Returns animation variants that respect the user's motion preference.
 * When reduced motion is preferred, returns instant/no-motion variants.
 */
export function useMotionSafe() {
  const shouldReduce = useFramerReducedMotion();

  return {
    shouldReduce,
    // Page transition
    pageVariants: shouldReduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
    // List stagger
    listVariants: shouldReduce
      ? { hidden: {}, show: {} }
      : { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
    // Item fade-in
    itemVariants: shouldReduce
      ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
      : { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
    // Modal
    modalVariants: shouldReduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : { initial: { opacity: 0, y: 40, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 40, scale: 0.95 } },
    // Toast
    toastVariants: shouldReduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : { initial: { opacity: 0, y: -40, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -20, scale: 0.9 } },
    // Default transition
    transition: shouldReduce
      ? { duration: 0 }
      : { duration: 0.3, ease: "easeOut" as const },
  };
}
