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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">VeloCard</h1>
        <p className="mt-3 text-lg text-neutral-400">
          Découvre ta carte de cycliste basée sur tes stats Strava
        </p>
      </div>
      <LoginButton />
    </main>
  );
}
