"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="mt-4 text-sm text-[#94A3B8] underline hover:text-white/80"
    >
      Se déconnecter
    </button>
  );
}
