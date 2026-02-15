"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/contexts/ToastContext";
import BottomTabBar from "./BottomTabBar";
import PosthogProvider from "./PosthogProvider";

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
      <ToastProvider>
        <ServiceWorkerRegistrar />
        <PosthogProvider />
        {children}
        <BottomTabBar />
      </ToastProvider>
    </SessionProvider>
  );
}
