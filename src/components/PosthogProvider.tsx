"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initAnalytics, identifyUser } from "@/lib/analytics";

export default function PosthogProvider() {
  const { data: session } = useSession();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.stravaId?.toString() || "unknown", {
        name: session.user.name,
      });
    }
  }, [session]);

  return null;
}
