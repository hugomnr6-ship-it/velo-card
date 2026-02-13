"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const tabs = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/clubs", label: "Clubs", icon: "🛡️" },
  { href: "/wars", label: "Guerres", icon: "⚔️" },
  { href: "/races", label: "Courses", icon: "🏁" },
  { href: "/leaderboard", label: "Rang", icon: "🏆" },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { status } = useSession();

  // Hide on login page, public card page, or if not authenticated
  if (
    status !== "authenticated" ||
    pathname === "/" ||
    pathname.startsWith("/card/")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive
                  ? "text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <span className={`text-xl ${isActive ? "" : "opacity-60"}`}>
                {tab.icon}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-white" : "text-neutral-500"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 h-0.5 w-10 rounded-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
