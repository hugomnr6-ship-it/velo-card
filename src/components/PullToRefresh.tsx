"use client";

import { m } from "framer-motion";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import type { ReactNode } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}

export default function PullToRefresh({
  children,
  onRefresh,
}: PullToRefreshProps) {
  const { containerRef, isRefreshing, pullDistance, pullProgress } =
    usePullToRefresh({
      onRefresh,
      threshold: 80,
    });

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute left-0 right-0 top-0 flex items-center justify-center overflow-hidden"
          style={{ height: isRefreshing ? 48 : pullDistance }}
        >
          <m.div
            animate={
              isRefreshing
                ? { rotate: 360 }
                : { rotate: pullProgress * 270 }
            }
            transition={
              isRefreshing
                ? { duration: 0.8, repeat: Infinity, ease: "linear" }
                : { duration: 0 }
            }
            className="h-6 w-6"
          >
            <svg
              viewBox="0 0 24 24"
              className="text-[#00F5D4]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2v6M12 2L8 6M12 2l4 4" />
              <path
                d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z"
                opacity={pullProgress}
              />
            </svg>
          </m.div>
        </div>
      )}

      {/* Content (shifted down during pull) */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 48 : pullDistance}px)`,
          transition:
            pullDistance === 0 && !isRefreshing
              ? "transform 0.3s ease"
              : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
