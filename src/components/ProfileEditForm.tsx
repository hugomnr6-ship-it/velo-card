"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/contexts/ToastContext";
import { FRENCH_REGIONS } from "@/types";

interface ProfileEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: {
    bio: string;
    favorite_climb: string;
    bike_name: string;
    region: string;
    avatar_url: string | null;
  };
  onSaved: () => void;
}

export default function ProfileEditForm({
  isOpen,
  onClose,
  currentData,
  onSaved,
}: ProfileEditFormProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [bio, setBio] = useState(currentData.bio);
  const [climb, setClimb] = useState(currentData.favorite_climb);
  const [bike, setBike] = useState(currentData.bike_name);
  const [region, setRegion] = useState(currentData.region);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast("Image trop volumineuse (max 2 Mo)", "error");
      return;
    }

    // Preview
    setPreviewUrl(URL.createObjectURL(file));

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Erreur upload", "error");
      } else {
        toast("Photo mise a jour", "success");
      }
    } catch {
      toast("Erreur upload", "error");
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, favorite_climb: climb, bike_name: bike, region }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Erreur", "error");
      } else {
        toast("Profil mis a jour", "success");
        onSaved();
        onClose();
      }
    } catch {
      toast("Erreur de sauvegarde", "error");
    }
    setSaving(false);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed inset-x-4 top-1/2 z-[101] mx-auto max-w-[380px] -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-[#0F1729] p-5"
            style={{ maxHeight: "80vh", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                Modifier le profil
              </h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Avatar */}
            <div className="mb-4 flex flex-col items-center">
              <button
                onClick={() => fileRef.current?.click()}
                className="group relative h-20 w-20 overflow-hidden rounded-full border border-white/10"
              >
                {(previewUrl || currentData.avatar_url) ? (
                  <img
                    src={previewUrl || `/api/img?url=${encodeURIComponent(currentData.avatar_url!)}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5 text-2xl text-white/30">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </button>
              {uploading && <p className="mt-1 text-[10px] text-white/30">Upload...</p>}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-white/30">
                  BIO ({bio.length}/160)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00F5D4]/30"
                  placeholder="Ta bio cycliste..."
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-white/30">
                  VELO
                </label>
                <input
                  value={bike}
                  onChange={(e) => setBike(e.target.value.slice(0, 80))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00F5D4]/30"
                  placeholder="Canyon Aeroad CF SL, Specialized Tarmac..."
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-white/30">
                  COL FAVORI
                </label>
                <input
                  value={climb}
                  onChange={(e) => setClimb(e.target.value.slice(0, 100))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00F5D4]/30"
                  placeholder="Col du Galibier, Mont Ventoux..."
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-white/30">
                  REGION
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00F5D4]/30"
                >
                  <option value="">Selectionner...</option>
                  {FRENCH_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00F5D4, #6366F1)" }}
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
