"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  HomeIcon,
  ShieldIcon,
  SwordsIcon,
  FlagIcon,
  TrophyIcon,
} from "./icons/TabIcons";
import type { ReactNode } from "react";

const tabs: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/dashboard", label: "Home", icon: <HomeIcon size={22} /> },
  { href: "/clubs", label: "Clubs", icon: <ShieldIcon size={22} /> },
  { href: "/wars", label: "Guerres", icon: <SwordsIcon size={22} /> },
  { href: "/races", label: "Courses", icon: <FlagIcon size={22} /> },
  { href: "/leaderboard", label: "Rang", icon: <TrophyIcon size={22} /> },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[rgba(10,10,18,0.95)] backdrop-blur-xl">
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
                  : "text-[#5A5A72] hover:text-[#8A8AA2]"
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
                    : "font-medium text-[#5A5A72]"
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
