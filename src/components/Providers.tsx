"use client";

import { SessionProvider } from "next-auth/react";
import BottomTabBar from "./BottomTabBar";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <BottomTabBar />
    </SessionProvider>
  );
}
