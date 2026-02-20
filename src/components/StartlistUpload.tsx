"use client";

import { useState, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";

interface RiderLine {
  rider_name: string;
  bib_number: number | null;
  club: string | null;
  category: string | null;
}

interface StartlistUploadProps {
  raceId: string;
  onImported: () => void;
}

export default function StartlistUpload({ raceId, onImported }: StartlistUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [riders, setRiders] = useState<RiderLine[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // ——— Manual add ———
  function addRider() {
    setRiders((prev) => [...prev, { rider_name: "", bib_number: null, club: null, category: null }]);
    if (!showForm) setShowForm(true);
  }

  function updateRider(index: number, field: keyof RiderLine, value: string) {
    setRiders((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              [field]: field === "bib_number"
                ? (value ? Number(value) : null)
                : (value || null),
            }
          : r,
      ),
    );
  }

  function removeRider(index: number) {
    setRiders((prev) => prev.filter((_, i) => i !== index));
  }

  // ——— OCR Upload ———
  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        toast(`Format non supporté : ${file.name}`, "error");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast(`Fichier trop volumineux : ${file.name}`, "error");
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setOcrLoading(true);
    setShowForm(true);
    try {
      let allNewRiders: RiderLine[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        if (validFiles.length > 1) {
          toast(`Analyse photo ${i + 1}/${validFiles.length}...`, "success");
        }

        const formData = new FormData();
        formData.append("file", validFiles[i]);

        const res = await fetch(`/api/races/${raceId}/ocr-startlist`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          const extracted = (data.riders || []).map((r: any) => ({
            rider_name: r.rider_name || "",
            bib_number: r.bib_number || null,
            club: r.club || null,
            category: r.category || null,
          }));
          allNewRiders = [...allNewRiders, ...extracted];
        } else {
          const err = await res.json();
          toast(err.error || "Erreur lors de l'analyse", "error");
        }
      }

      if (allNewRiders.length > 0) {
        // Merge + deduplicate
        const existing = riders.filter((r) => r.rider_name.trim());
        const combined = [...existing, ...allNewRiders];

        const seen = new Set<string>();
        const deduped = combined.filter((r) => {
          const key = r.rider_name.trim().toLowerCase();
          if (!key) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const dupes = combined.length - deduped.length;
        setRiders(deduped);
        toast(
          `${deduped.length} coureur(s) détectés${dupes > 0 ? ` (${dupes} doublon(s) retiré(s))` : ""} — vérifie avant d'importer`,
          "success",
        );
      } else {
        toast("Aucun coureur détecté", "error");
      }
    } catch (err: any) {
      toast(err.message || "Erreur réseau", "error");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  // ——— Submit to API ———
  async function handleSubmit() {
    const filled = riders.filter((r) => r.rider_name.trim());
    if (filled.length === 0) {
      toast("Ajoute au moins un coureur", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/races/${raceId}/engages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riders: filled }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(
          `${data.total} engagé(s) importés ! ${data.matched > 0 ? `${data.matched} coureur(s) VeloCard reconnu(s)` : ""} ${data.ghosts > 0 ? `· ${data.ghosts} fantôme(s)` : ""}`,
          "success",
        );
        setRiders([]);
        setShowForm(false);
        onImported();
      } else {
        const err = await res.json();
        toast(err.error || "Erreur lors de l'import", "error");
      }
    } catch {
      toast("Erreur réseau", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#94A3B8]">
          Importer la liste des engagés
        </h3>

        {/* OCR Upload Buttons */}
        <div className="flex items-center gap-2">
          {/* Camera (mobile) */}
          <label
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-white/[0.10] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/90 ${ocrLoading ? "pointer-events-none opacity-50" : ""}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {ocrLoading ? "..." : "Photo"}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={handleOcrUpload}
              disabled={ocrLoading}
            />
          </label>

          {/* Gallery / PDF */}
          <label
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-white/[0.10] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/90 ${ocrLoading ? "pointer-events-none opacity-50" : ""}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {ocrLoading ? "Analyse..." : "Galerie / PDF"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={handleOcrUpload}
              disabled={ocrLoading}
            />
          </label>
        </div>
      </div>

      {/* OCR loading indicator */}
      {ocrLoading && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#6366F1]/20 bg-[#6366F1]/5 px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
          <span className="text-xs text-[#818CF8]">Analyse en cours...</span>
        </div>
      )}

      {/* Riders list */}
      {showForm && (
        <>
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto scrollbar-none">
            {riders.map((rider, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* Bib number */}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="#"
                  value={rider.bib_number ?? ""}
                  onChange={(e) => updateRider(i, "bib_number", e.target.value.replace(/\D/g, ""))}
                  className="w-12 shrink-0 rounded-lg border border-white/[0.08] bg-[#111827]/50 px-2 py-2 text-center text-sm text-white placeholder-[#475569] outline-none transition focus:border-[#6366F1]/50"
                />

                {/* Name */}
                <input
                  type="text"
                  placeholder="Nom du coureur"
                  value={rider.rider_name}
                  onChange={(e) => updateRider(i, "rider_name", e.target.value)}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-[#111827]/50 px-3 py-2 text-sm text-white placeholder-[#475569] outline-none transition focus:border-[#6366F1]/50"
                />

                {/* Club (smaller) */}
                <input
                  type="text"
                  placeholder="Club"
                  value={rider.club ?? ""}
                  onChange={(e) => updateRider(i, "club", e.target.value)}
                  className="w-28 shrink-0 rounded-lg border border-white/[0.08] bg-[#111827]/50 px-2 py-2 text-sm text-white placeholder-[#475569] outline-none transition focus:border-[#6366F1]/50 hidden sm:block"
                />

                {/* Remove */}
                <button
                  onClick={() => removeRider(i)}
                  className="shrink-0 rounded-lg p-2 text-[#475569] transition hover:bg-[#22223A]/60 hover:text-[#94A3B8]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={addRider}
              className="rounded-lg border border-dashed border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/80"
            >
              + Ajouter manuellement
            </button>
          </div>

          {riders.length > 0 && (
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <p className="text-xs text-[#475569]">
                {riders.filter((r) => r.rider_name.trim()).length} coureur(s) — les profils VeloCard seront liés automatiquement
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-50"
              >
                {submitting ? "Import..." : "Importer la liste"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Initial state: no riders yet */}
      {!showForm && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-xs text-[#475569] text-center">
            Prends en photo la liste des engagés ou ajoute les coureurs manuellement
          </p>
          <button
            onClick={addRider}
            className="rounded-lg border border-dashed border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/80"
          >
            + Ajouter manuellement
          </button>
        </div>
      )}
    </div>
  );
}
