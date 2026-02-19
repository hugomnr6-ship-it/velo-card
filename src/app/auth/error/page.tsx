"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

const ERROR_MAP: Record<string, { title: string; message: string; icon: string }> = {
  OAuthCallback: {
    title: "Connexion impossible",
    message:
      "Le serveur Strava ne répond pas. C'est un problème de leur côté, pas du tien. Réessaie dans quelques minutes.",
    icon: "server",
  },
  OAuthSignin: {
    title: "Erreur de connexion",
    message:
      "Impossible de démarrer la connexion avec Strava. Leur service est peut-être temporairement indisponible.",
    icon: "server",
  },
  OAuthAccountNotLinked: {
    title: "Compte déjà utilisé",
    message:
      "Ce compte est déjà lié à un autre provider. Connecte-toi avec le provider que tu as utilisé la première fois.",
    icon: "link",
  },
  AccessDenied: {
    title: "Accès refusé",
    message:
      "Tu as refusé l'autorisation ou ton compte n'a pas les permissions nécessaires. Réessaie et accepte les autorisations demandées.",
    icon: "lock",
  },
  default: {
    title: "Oups, quelque chose a planté",
    message:
      "Une erreur inattendue est survenue lors de la connexion. Réessaie dans quelques instants.",
    icon: "alert",
  },
};

function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <rect x="2" y="3" width="20" height="7" rx="2" />
      <rect x="2" y="14" width="20" height="7" rx="2" />
      <circle cx="6" cy="6.5" r="1" fill="currentColor" />
      <circle cx="6" cy="17.5" r="1" fill="currentColor" />
      <line x1="10" y1="6.5" x2="18" y2="6.5" />
      <line x1="10" y1="17.5" x2="18" y2="17.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

const icons: Record<string, () => React.ReactElement> = {
  server: ServerIcon,
  link: LinkIcon,
  lock: LockIcon,
  alert: AlertIcon,
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "default";
  const errorInfo = ERROR_MAP[errorCode] ?? ERROR_MAP.default;
  const IconComponent = icons[errorInfo.icon] ?? icons.alert;

  const isServerError = errorInfo.icon === "server";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0F] px-4">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* Icon container */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
          <IconComponent />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          {errorInfo.title}
        </h1>

        {/* Message */}
        <p className="mt-3 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
          {errorInfo.message}
        </p>

        {/* Strava status hint */}
        {isServerError && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#FC4C02]/20 bg-[#FC4C02]/5 px-4 py-3">
            <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#FC4C02]" />
            <p className="text-xs text-[#FC4C02]/80">
              Vérifie l&apos;état de Strava sur{" "}
              <a
                href="https://status.strava.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 hover:text-[#FC4C02]"
              >
                status.strava.com
              </a>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={() => signIn("strava")}
            className="flex items-center gap-2 rounded-xl bg-[#FC4C02] px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
            style={{ boxShadow: "0 0 24px rgba(252,76,2,0.25)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Réessayer avec Strava
          </button>

          <a
            href="/"
            className="text-sm font-semibold text-[#64748B] transition hover:text-white"
          >
            Retour à l&apos;accueil
          </a>
        </div>

        {/* Error code (discret) */}
        <p className="mt-10 text-[10px] font-mono text-[#334155]">
          Erreur : {errorCode}
        </p>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
        </main>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
