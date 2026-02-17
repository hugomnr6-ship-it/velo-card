"use client";

import { m } from "framer-motion";
import { useMotionSafe } from "@/hooks/useReducedMotion";
import type { ReactNode } from "react";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export default function AnimatedPage({ children, className = "" }: AnimatedPageProps) {
  const { pageVariants, transition } = useMotionSafe();

  return (
    <m.div
      initial={pageVariants.initial}
      animate={pageVariants.animate}
      transition={transition}
      className={className}
    >
      {children}
    </m.div>
  );
}
