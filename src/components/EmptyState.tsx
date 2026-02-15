"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-white/[0.06] bg-[#111827]/60 p-8 text-center"
    >
      <div className="mx-auto mb-3 text-4xl opacity-40">{icon}</div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-[#94A3B8]">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-block rounded-lg bg-[#6366F1] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6366F1]/80"
        >
          {action.label}
        </Link>
      )}
    </motion.div>
  );
}
