"use client";

import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("strava")}
      className="rounded-full bg-[#FC4C02] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#e04400] shadow-[0_0_24px_rgba(252,76,2,0.3)]"
    >
      Se connecter avec Strava
    </button>
  );
}
