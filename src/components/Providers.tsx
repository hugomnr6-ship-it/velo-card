"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/contexts/ToastContext";
import BottomTabBar from "./BottomTabBar";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <BottomTabBar />
      </ToastProvider>
    </SessionProvider>
  );
}
