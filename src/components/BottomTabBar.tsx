"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { m } from "framer-motion";
import { useCallback, useEffect } from "react";
import {
  HomeIcon,
  FlagIcon,
  SwordsIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
} from "./icons/TabIcons";
import type { ReactNode } from "react";

const baseTabs: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/dashboard", label: "Home", icon: <HomeIcon size={22} /> },
  { href: "/races", label: "Courses", icon: <FlagIcon size={22} /> },
  { href: "/duels", label: "Duels", icon: <SwordsIcon size={22} /> },
  { href: "/leaderboard", label: "Rang", icon: <TrophyIcon size={22} /> },
  { href: "/profile", label: "Profil", icon: <UserIcon size={22} /> },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Résout le lien profil vers /profile/{userId} si la session est disponible
  const profileId = session?.user?.id;
  const tabs = baseTabs.map((tab) =>
    tab.href === "/profile" && profileId
      ? { ...tab, href: `/profile/${profileId}` }
      : tab,
  );

  // Prefetch all tab routes + key pages on mount (important for mobile — no hover)
  useEffect(() => {
    tabs.forEach((tab) => router.prefetch(tab.href));
    router.prefetch("/quests");
  }, [router, profileId]);

  // Also prefetch on hover/focus for desktop
  const handlePrefetch = useCallback((path: string) => {
    router.prefetch(path);
  }, [router]);

  if (
    status !== "authenticated" ||
    pathname === "/" ||
    pathname.startsWith("/card/")
  ) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[rgba(11,17,32,0.85)] backdrop-blur-2xl"
      role="navigation"
      aria-label="Navigation principale"
      style={{ WebkitBackdropFilter: "blur(24px) saturate(180%)", backdropFilter: "blur(24px) saturate(180%)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[max(4px,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          // Profil tab: highlight pour /profile ET /profile/[userId]
          const baseHref = tab.label === "Profil" ? "/profile" : tab.href;
          const isActive =
            pathname === tab.href || pathname.startsWith(baseHref + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => handlePrefetch(tab.href)}
              onFocus={() => handlePrefetch(tab.href)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 min-h-[44px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F5D4] ${
                isActive
                  ? "text-[#00F5D4]"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              {isActive && (
                <m.div
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
