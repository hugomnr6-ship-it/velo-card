"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  captureCard,
  generateQR,
  drawStoryCanvas,
  shareOrDownload,
  downloadDataUrl,
} from "@/lib/share-utils";
import type { CardTier } from "@/types";
import { trackEvent } from "@/lib/analytics";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: CardTier;
  userId: string;
}

type ShareAction = "story" | "card" | "link" | "qr";

export default function ShareModal({ isOpen, onClose, tier, userId }: ShareModalProps) {
  const [loading, setLoading] = useState<ShareAction | null>(null);
  const [copied, setCopied] = useState(false);
  const modalRef = useFocusTrap(isOpen, onClose);

  const cardUrl = `https://velocard.app/card/${userId}`;

  async function handleStory() {
    setLoading("story");
    try {
      const [cardData, qrData] = await Promise.all([
        captureCard(),
        generateQR(userId, tier),
      ]);
      const storyData = await drawStoryCanvas(cardData, tier, qrData);
      await shareOrDownload(storyData, "velocard-story.png");
      trackEvent("card_shared", { method: "story", tier });
    } catch (err) {
      console.error("Story export error:", err);
    }
    setLoading(null);
  }

  async function handleCard() {
    setLoading("card");
    try {
      const cardData = await captureCard();
      await shareOrDownload(cardData, "velocard-card.png");
      trackEvent("card_shared", { method: "card_image", tier });
    } catch (err) {
      console.error("Card export error:", err);
    }
    setLoading(null);
  }

  async function handleCopyLink() {
    setLoading("link");
    try {
      await navigator.clipboard.writeText(cardUrl);
      trackEvent("card_shared", { method: "copy_link", tier });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select-and-copy
      const input = document.createElement("input");
      input.value = cardUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setLoading(null);
  }

  async function handleQR() {
    setLoading("qr");
    try {
      const qrData = await generateQR(userId, tier);
      downloadDataUrl(qrData, "velocard-qr.png");
      trackEvent("card_shared", { method: "qr_code", tier });
    } catch (err) {
      console.error("QR export error:", err);
    }
    setLoading(null);
  }

  const actions: { key: ShareAction; label: string; sublabel: string; icon: React.ReactNode; handler: () => void }[] = [
    {
      key: "story",
      label: "Story Instagram",
      sublabel: "1080 x 1920px",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
        </svg>
      ),
      handler: handleStory,
    },
    {
      key: "card",
      label: "Image de la carte",
      sublabel: "280 x 470px",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      ),
      handler: handleCard,
    },
    {
      key: "link",
      label: copied ? "Lien copie !" : "Copier le lien",
      sublabel: "velocard.app/card/...",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      ),
      handler: handleCopyLink,
    },
    {
      key: "qr",
      label: "QR Code",
      sublabel: "Telecharger le QR",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="3" height="3" />
          <path d="M21 14h-3v3h3v4h-4" />
          <path d="M14 21h3" />
        </svg>
      ),
      handler: handleQR,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <m.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-8 z-[101] mx-auto max-w-[360px] rounded-2xl border border-white/10 bg-[#0F1729] p-5"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 id="share-modal-title" className="font-['Space_Grotesk'] text-lg font-bold text-white">
                Partager
              </h3>
              <button
                onClick={onClose}
                aria-label="Fermer le menu de partage"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00F5D4]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {actions.map((action) => (
                <button
                  key={action.key}
                  onClick={action.handler}
                  disabled={loading !== null}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-white/5 disabled:opacity-50"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/60">
                    {loading === action.key ? (
                      <m.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/60"
                      />
                    ) : (
                      action.icon
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {action.label}
                    </p>
                    <p className="text-xs text-white/50">{action.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
