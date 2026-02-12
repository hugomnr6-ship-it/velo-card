"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="mt-4 text-sm text-neutral-500 underline hover:text-neutral-300"
    >
      Se déconnecter
    </button>
  );
}
