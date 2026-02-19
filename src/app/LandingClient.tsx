"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { m, useInView } from "framer-motion";
import DemoCard from "@/components/DemoCard";

/* ═══ Demo data ═══ */
const demoCards = [
  {
    username: "Lucas M.",
    ovr: 82,
    tier: "diamant" as const,
    stats: { pac: 78, mon: 85, val: 72, spr: 69, end: 88, res: 80 },
  },
  {
    username: "Marie D.",
    ovr: 71,
    tier: "platine" as const,
    stats: { pac: 65, mon: 70, val: 75, spr: 60, end: 78, res: 72 },
  },
  {
    username: "Hugo R.",
    ovr: 45,
    tier: "bronze" as const,
    stats: { pac: 42, mon: 38, val: 50, spr: 55, end: 40, res: 48 },
  },
];

const features = [
  {
    icon: "\u2694\uFE0F",
    title: "Duels",
    desc: "Defie n'importe quel cycliste en 1v1. Compare vos stats. Le perdant voit sa carte rouge de honte.",
  },
  {
    icon: "\uD83C\uDFC6",
    title: "Classements",
    desc: "Regional, national, par club. Trie par vitesse, montagne, endurance. Ou te situes-tu ?",
  },
  {
    icon: "\uD83D\uDDFA\uFE0F",
    title: "Analyse de parcours",
    desc: "Upload un GPX, visualise le profil d'elevation, le vent, les sections dures. Prepare ta course comme un pro.",
  },
  {
    icon: "\uD83D\uDC7B",
    title: "Ghost Cards",
    desc: "Meme les coureurs sans compte ont une carte. Resultats de course = carte automatique.",
  },
  {
    icon: "\uD83C\uDFD4\uFE0F",
    title: "Guerres des Pelotons",
    desc: "Ton club contre un autre. 3 tours : distance, D+, sprint. Qui sera le meilleur peloton ?",
  },
  {
    icon: "\uD83D\uDCF1",
    title: "Partage Instagram",
    desc: "Ta carte en format Story. QR code pour defier au depart. Le design qui fait jalouser le peloton.",
  },
];

const steps = [
  {
    num: "01",
    title: "Connecte ton Strava",
    desc: "On analyse tes 50 dernieres sorties velo automatiquement",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-[#FC4C02]">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Decouvre ta carte",
    desc: "6 stats, un OVR, un tier de Bronze a Legende. C'est ta carte FIFA, version velo.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-[#6366F1]">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20v-1a5 5 0 0110 0v1" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Progresse chaque lundi",
    desc: "Tes stats sont recalculees chaque lundi. Defie tes potes, monte dans le classement.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-[#22C55E]">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

const socialStats = [
  { value: "76M", label: "Utilisateurs Strava dans le monde" },
  { value: "4.25Md\u20AC", label: "Marche apps cyclisme 2033" },
  { value: "0", label: "Apps qui font les 2 piliers" },
  { value: "6", label: "Stats par carte" },
];

/* ═══ Animated section wrapper ═══ */
function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <m.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#16161F] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <span className={`text-[#64748B] transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-[#94A3B8] leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return <p className="text-sm text-[#22C55E] font-semibold">Merci ! Tu seras notifié des nouveautés.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="subscribe-email" className="sr-only">Adresse email</label>
      <input
        id="subscribe-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@email.com"
        required
        className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
      >
        {status === 'loading' ? '...' : "S'inscrire"}
      </button>
    </form>
  );
}

export default function LandingClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <div role="status" aria-label="Chargement" className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
      </main>
    );
  }

  const handleScrollDown = () => {
    document.getElementById("piliers")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0A0A0F]">
      {/* ═══ HERO ═══ */}
      <section className="relative flex flex-col items-center px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 15%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(0,212,255,0.05) 0%, transparent 40%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <m.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6366F1]/20 bg-[#6366F1]/10 px-4 py-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-semibold text-[#6366F1]">
              Beta ouverte
            </span>
          </m.div>

          {/* Title */}
          <m.h1
            className="max-w-2xl text-[28px] font-black tracking-tight text-white sm:text-6xl leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Transforme tes sorties velo en{" "}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#00D4FF] bg-clip-text text-transparent">
              carte FIFA
            </span>
          </m.h1>

          {/* Subtitle */}
          <m.p
            className="mx-auto mt-5 max-w-lg text-sm text-[#94A3B8] sm:text-lg leading-relaxed px-2 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            L&apos;app qui centralise tout pour ta course : parcours, meteo, vent,
            classements. Et qui transforme chaque coup de pedale en stats visibles
            sur ta carte.
          </m.p>

          {/* CTA */}
          <m.div
            className="mt-8 flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={() => signIn("strava")}
                className="flex items-center gap-2 rounded-xl bg-[#FC4C02] px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
                style={{ boxShadow: "0 0 24px rgba(252,76,2,0.3)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Connecter Strava
              </button>
              <button
                onClick={() => signIn("wahoo")}
                className="flex items-center gap-2 rounded-xl bg-[#1A8CFF] px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
                style={{ boxShadow: "0 0 24px rgba(26,140,255,0.3)" }}
              >
                <span className="text-base font-black">W</span>
                Connecter Wahoo
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2 cursor-not-allowed">
              <span className="text-xs font-semibold text-white/30">Garmin &mdash; Prochainement</span>
            </div>
            <button
              onClick={handleScrollDown}
              className="text-sm font-semibold text-[#94A3B8] transition hover:text-white"
            >
              Voir comment ca marche &darr;
            </button>
          </m.div>

          {/* Demo cards — responsive: contained within viewport */}
          <m.div
            className="mt-14 flex items-end justify-center w-full max-w-[100vw] overflow-hidden px-2 sm:px-0 sm:gap-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {demoCards.map((card, i) => {
              const isCenter = i === 1;
              const isLeft = i === 0;
              return (
                <m.div
                  key={card.username}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
                  className={`shrink min-w-0 ${isCenter ? "z-[2] shrink-0" : "z-[1]"}`}
                  style={{
                    transform: isLeft
                      ? "perspective(1000px) rotateY(5deg)"
                      : !isCenter
                      ? "perspective(1000px) rotateY(-5deg)"
                      : undefined,
                  }}
                >
                  <div className={isCenter
                    ? "w-[105px] sm:w-[190px]"
                    : "w-[80px] sm:w-[160px] opacity-70 sm:opacity-100"
                  }>
                    <DemoCard {...card} />
                  </div>
                </m.div>
              );
            })}
          </m.div>
        </div>
      </section>

      {/* ═══ SECTION 2 — Les 2 Piliers ═══ */}
      <section id="piliers" className="px-6 py-20" style={{ background: "#111118" }}>
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="mb-12 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Deux raisons de ne jamais supprimer VeloCard
            </h2>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2">
            <AnimatedSection delay={0.1}>
              <div className="group rounded-2xl border border-white/[0.06] bg-[#16161F] p-6 transition hover:border-[#6366F1]/20">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl">{"\uD83D\uDDFA\uFE0F"}</span>
                  <span className="rounded-full bg-[#22C55E]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#22C55E]">
                    Gratuit
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Tout pour ta course</h3>
                <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                  Parcours interactif, meteo du jour J, vent sur le circuit, passages
                  difficiles, favoris au depart. Plus besoin de 5 apps differentes.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="group rounded-2xl border border-white/[0.06] bg-[#16161F] p-6 transition hover:border-[#6366F1]/20">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl">{"\uD83C\uDCCF"}</span>
                  <span className="rounded-full bg-[#6366F1]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#6366F1]">
                    Addictif
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Ta carte evolue</h3>
                <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                  6 stats calculees automatiquement, tier qui monte (ou descend),
                  duels head-to-head, classements regionaux. Tu veux monter ton OVR.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — 3 Etapes ═══ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="mb-12 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              3 etapes, 30 secondes
            </h2>
          </AnimatedSection>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <AnimatedSection key={step.num} delay={i * 0.15}>
                <div className="flex flex-col items-center text-center">
                  <span className="mb-4 text-4xl font-black text-white/10">{step.num}</span>
                  <div className="mb-3">{step.icon}</div>
                  <h3 className="text-base font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-[#94A3B8]">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4 — Features Grid ═══ */}
      <section className="px-6 py-20" style={{ background: "#111118" }}>
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="mb-12 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Tout ce que VeloCard fait pour toi
            </h2>
          </AnimatedSection>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.08}>
                <div className="rounded-xl border border-white/[0.06] bg-[#16161F] p-5 transition hover:border-[#6366F1]/20">
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="mt-2 text-sm font-bold text-white">{f.title}</h3>
                  <p className="mt-1 text-xs text-[#64748B] leading-relaxed">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — Social Proof / Stats ═══ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="mb-12 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Les chiffres qui comptent
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {socialStats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#16161F] p-5 text-center"
                >
                  <span className="text-2xl font-black text-[#6366F1] sm:text-3xl">
                    {s.value}
                  </span>
                  <span className="mt-2 text-[10px] text-[#64748B] leading-tight">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ SECTION 6 — Social Proof ═══ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ils roulent avec VeloCard
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="flex justify-center gap-6 flex-wrap">
              {[
                { number: "5K+", label: "Cyclistes actifs" },
                { number: "120K+", label: "km suivis" },
                { number: "8K+", label: "Duels joués" },
                { number: "4.8/5", label: "Note moyenne" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#16161F] px-6 py-4 text-center min-w-[120px]">
                  <span className="text-2xl font-black text-[#6366F1]">{s.number}</span>
                  <span className="mt-1 text-[10px] text-[#64748B]">{s.label}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ SECTION 7 — FAQ ═══ */}
      <section id="faq" className="px-6 py-16" style={{ background: "#111118" }}>
        <div className="mx-auto max-w-3xl">
          <AnimatedSection className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Questions fréquentes
            </h2>
          </AnimatedSection>
          <div className="space-y-3">
            <FAQItem q="C'est gratuit ?" a="Oui ! VeloCard est gratuit. Un abonnement Pro est disponible pour débloquer les duels illimités, les cartes spéciales et le classement mondial. 7 jours d'essai gratuit." />
            <FAQItem q="Comment sont calculées les stats ?" a="Tes 6 attributs (Vitesse, Montée, Technique, Sprint, Endurance, Puissance) sont calculés à partir de tes activités réelles sur Strava, Garmin ou Wahoo." />
            <FAQItem q="Mes données sont-elles en sécurité ?" a="Oui. Nous ne stockons que les données nécessaires au fonctionnement de l'app. Tu peux exporter ou supprimer tes données à tout moment." />
            <FAQItem q="Puis-je jouer sans Strava ?" a="VeloCard supporte Strava, Garmin Connect et Wahoo. Au moins un compte est nécessaire pour synchroniser tes activités." />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 8 — Email Capture ═══ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-md text-center">
          <AnimatedSection>
            <h2 className="text-2xl font-black text-white mb-2">Reste informé</h2>
            <p className="text-sm text-[#94A3B8] mb-6">Inscris-toi pour recevoir les mises à jour et les nouvelles fonctionnalités.</p>
            <EmailCapture />
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ SECTION — Pricing teaser ═══ */}
      <section className="px-6 py-20" style={{ background: "#111118" }}>
        <div className="mx-auto max-w-4xl text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Gratuit pour commencer. Pro pour dominer.
            </h2>
            <p className="text-[#94A3B8] mt-4 mb-8 max-w-2xl mx-auto">
              Crée ta VeloCard gratuitement. Passe Pro pour débloquer les duels illimités,
              les cartes spéciales et le classement mondial.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/pricing"
                className="px-8 py-3 bg-[#6366F1] hover:bg-[#6366F1]/80 rounded-xl font-semibold transition text-white"
              >
                Voir les plans &rarr;
              </a>
            </div>
            <p className="text-[#475569] text-sm mt-4">
              7 jours d&apos;essai gratuit &bull; Sans engagement &bull; Annulation en 1 clic
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ SECTION 9 — CTA Final ═══ */}
      <section className="relative px-6 py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-lg text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Ta carte t&apos;attend
            </h2>
            <p className="mt-3 text-base text-[#94A3B8]">
              Connecte ton Strava. C&apos;est gratuit. C&apos;est en 30 secondes.
            </p>
            <button
              onClick={() => signIn("strava")}
              className="mt-8 flex items-center gap-2 mx-auto rounded-xl bg-[#6366F1] px-8 py-4 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: "0 0 30px rgba(99,102,241,0.3)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Creer ma carte gratuitement
            </button>
            <p className="mt-4 text-[11px] text-[#475569]">
              Aucune donnee personnelle stockee. On lit tes activites velo, c&apos;est tout.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/[0.04] px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              Velo
              <span className="text-[#6366F1]">Card</span>
            </span>
            <span className="text-xs text-[#475569]">&copy; 2026</span>
          </div>
          <div className="flex gap-4 text-xs text-[#475569]">
            <a href="/privacy" className="transition hover:text-white/50">
              Politique de confidentialité
            </a>
            <a href="/terms" className="transition hover:text-white/50">
              CGU
            </a>
            <a href="#" className="transition hover:text-white/50">
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
