"use client";

import { m } from "framer-motion";
import { useMotionSafe } from "@/hooks/useReducedMotion";
import type { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedList({ children, className = "", delay }: AnimatedListProps) {
  const { listVariants, shouldReduce } = useMotionSafe();

  const variants = shouldReduce
    ? listVariants
    : delay !== undefined
      ? { hidden: {}, show: { transition: { staggerChildren: delay } } }
      : listVariants;

  return (
    <m.div
      variants={variants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </m.div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className = "" }: AnimatedListItemProps) {
  const { itemVariants } = useMotionSafe();

  return (
    <m.div variants={itemVariants} className={className}>
      {children}
    </m.div>
  );
}
