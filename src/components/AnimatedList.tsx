"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedList({ children, className = "", delay }: AnimatedListProps) {
  const variants = delay !== undefined
    ? {
        ...containerVariants,
        show: { transition: { staggerChildren: delay } },
      }
    : containerVariants;

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className = "" }: AnimatedListItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
