"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { m, AnimatePresence } from "framer-motion";

const TYPES = [
  { key: "bug", label: "🐛 Bug", color: "#EF4444" },
  { key: "suggestion", label: "💡 Idée", color: "#6366F1" },
  { key: "other", label: "💬 Autre", color: "#94A3B8" },
] as const;

type FeedbackType = (typeof TYPES)[number]["key"];

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          pageUrl: window.location.pathname,
        }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      setSent(true);
      setMessage("");
      setTimeout(() => {
        setSent(false);
        setIsOpen(false);
      }, 2000);
    },
  });

  const close = () => {
    setIsOpen(false);
    mutation.reset();
  };

  return (
    <>
      {/* ─── Floating button ─── */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-[#16161F] shadow-lg transition-transform hover:scale-110 active:scale-95"
        aria-label="Donner un feedback"
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6366F1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          <path d="M8 12h.01" />
          <path d="M12 12h.01" />
          <path d="M16 12h.01" />
        </svg>
      </button>

      {/* ─── Modal ─── */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={close}
          >
            <m.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#16161F] p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-title"
            >
              {sent ? (
                /* ─── Success state ─── */
                <div className="py-8 text-center">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="text-sm font-bold text-white">
                    Merci pour ton retour !
                  </p>
                  <p className="mt-1 text-[11px] text-white/40">
                    On le prend en compte.
                  </p>
                </div>
              ) : (
                <>
                  {/* ─── Header ─── */}
                  <div className="mb-4 flex items-center justify-between">
                    <h3
                      id="feedback-title"
                      className="text-sm font-bold text-white"
                    >
                      Ton feedback
                    </h3>
                    <button
                      onClick={close}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/40 transition hover:text-white/70"
                      aria-label="Fermer"
                    >
                      <svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* ─── Type pills ─── */}
                  <div className="mb-4 flex gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setType(t.key)}
                        className={`flex-1 rounded-lg px-2 py-2 text-[11px] font-bold transition ${
                          type === t.key
                            ? "border-2 bg-white/[0.06]"
                            : "border border-white/[0.04] bg-white/[0.02] text-white/40"
                        }`}
                        style={
                          type === t.key
                            ? { borderColor: t.color, color: t.color }
                            : {}
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* ─── Textarea ─── */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décris le problème ou ton idée..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50"
                    aria-label="Message"
                  />

                  {/* ─── Error ─── */}
                  {mutation.isError && (
                    <p className="mt-2 text-[11px] text-red-400">
                      Erreur d&apos;envoi, réessaie.
                    </p>
                  )}

                  {/* ─── Submit ─── */}
                  <button
                    onClick={() => mutation.mutate()}
                    disabled={message.length < 10 || mutation.isPending}
                    className="mt-3 w-full rounded-xl bg-[#6366F1] py-3 text-xs font-bold text-white transition disabled:opacity-30"
                  >
                    {mutation.isPending ? "Envoi..." : "Envoyer"}
                  </button>

                  <p className="mt-2 text-center text-[9px] text-white/15">
                    {message.length < 10
                      ? `Encore ${10 - message.length} caractères min.`
                      : ""}
                  </p>
                </>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
