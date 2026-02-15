"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  HomeIcon,
  SwordsIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
} from "./icons/TabIcons";
import type { ReactNode } from "react";

const tabs: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/dashboard", label: "Home", icon: <HomeIcon size={22} /> },
  { href: "/duels", label: "Duels", icon: <SwordsIcon size={22} /> },
  { href: "/echappee", label: "Échappée", icon: <StarIcon size={22} /> },
  { href: "/leaderboard", label: "Rang", icon: <TrophyIcon size={22} /> },
  { href: "/profile", label: "Profil", icon: <UserIcon size={22} /> },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { status } = useSession();

  if (
    status !== "authenticated" ||
    pathname === "/" ||
    pathname.startsWith("/card/")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[rgba(11,17,32,0.85)] backdrop-blur-2xl" style={{ WebkitBackdropFilter: "blur(24px) saturate(180%)", backdropFilter: "blur(24px) saturate(180%)" }}>
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive
                  ? "text-[#00F5D4]"
                  : "text-[#475569] hover:text-[#64748B]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-[#00F5D4]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`transition-opacity ${isActive ? "opacity-100" : "opacity-50"}`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[10px] ${
                  isActive
                    ? "font-semibold text-[#00F5D4]"
                    : "font-medium text-[#475569]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
