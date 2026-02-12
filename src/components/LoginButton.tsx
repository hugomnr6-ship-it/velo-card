"use client";

import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("strava")}
      className="rounded-full bg-[#FC4C02] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e04400]"
    >
      Se connecter avec Strava
    </button>
  );
}
