"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { LazyMotion, domAnimation } from "framer-motion";
import { ToastProvider } from "@/contexts/ToastContext";
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
          <QueryProvider>
            <ToastProvider>
              <ServiceWorkerRegistrar />
              <PosthogProvider />
              <WebVitalsReporter />
              {children}
              <BottomTabBar />
              <FeedbackButton />
            </ToastProvider>
          </QueryProvider>
        </LazyMotion>
      </ThemeProvider>
    </SessionProvider>
  );
}
