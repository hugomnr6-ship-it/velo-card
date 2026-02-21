"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import { ToastProvider } from "@/contexts/ToastContext";
import { CoinRewardProvider } from "@/contexts/CoinRewardContext";
import QueryProvider from "./QueryProvider";
import BottomTabBar from "./BottomTabBar";
import FeedbackButton from "./FeedbackButton";
import PosthogProvider from "./PosthogProvider";
import WebVitalsReporter from "./WebVitalsReporter";

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — silently ignore
      });
    }
  }, []);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <LazyMotion features={domAnimation} strict>
          <MotionConfig reducedMotion="user">
          <QueryProvider>
            <ToastProvider>
              <CoinRewardProvider>
                <ServiceWorkerRegistrar />
                <PosthogProvider />
                <WebVitalsReporter />
                {children}
                <BottomTabBar />
                <FeedbackButton />
              </CoinRewardProvider>
            </ToastProvider>
          </QueryProvider>
        </MotionConfig>
        </LazyMotion>
      </ThemeProvider>
    </SessionProvider>
  );
}
