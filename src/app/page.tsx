"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginButton from "@/components/LoginButton";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <p className="text-[#94A3B8]">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-10 overflow-hidden bg-[#0B1120] p-8">
      {/* Animated gradient bg */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(108,92,231,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,245,212,0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 text-center">
        <h1 className="text-5xl font-black tracking-tight text-white font-['Space_Grotesk']">
          VeloCard
        </h1>
        <p className="mt-3 text-lg text-[#94A3B8]">
          Ta carte de cycliste. Tes stats. Ton style.
        </p>
      </div>

      <div className="relative z-10">
        <LoginButton />
      </div>
    </main>
  );
}
