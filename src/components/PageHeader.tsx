"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}

export default function PageHeader({ icon, title, subtitle }: PageHeaderProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mb-6 w-full"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="text-[#94A3B8]">{icon}</span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-[#94A3B8] bg-clip-text text-transparent font-[family-name:var(--font-family-title)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-[#94A3B8]">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="mt-3 h-px w-full bg-gradient-to-r from-[#6366F1]/20 via-[#6366F1]/10 to-transparent" />
    </m.div>
  );
}
