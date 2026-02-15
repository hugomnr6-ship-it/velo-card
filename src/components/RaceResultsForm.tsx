"use client";

import { useState, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";
import type { RaceResultView } from "@/types";

interface ResultLine {
  rider_name: string;
  finish_time_str: string; // HH:MM:SS
}

interface RaceResultsFormProps {
  raceId: string;
  onPublished: () => void;
  existingResults?: RaceResultView[];
  existingRaceTime?: number;  // seconds
  existingAvgSpeed?: number;  // km/h
}

function parseTimeToSeconds(time: string): number | null {
  // Accept H:MM:SS, HH:MM:SS, or MM:SS
  const parts = time.split(":").map(Number);
  if (parts.some(isNaN)) return null;

  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (m < 0 || m >= 60 || s < 0 || s >= 60) return null;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    if (s < 0 || s >= 60) return null;
    return m * 60 + s;
  }
  return null;
}

function secondsToTimeStr(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RaceResultsForm({
  raceId,
  onPublished,
  existingResults,
  existingRaceTime,
  existingAvgSpeed,
}: RaceResultsFormProps) {
  const { toast } = useToast();
  const isEditing = !!existingResults && existingResults.length > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialLines: ResultLine[] = isEditing
    ? existingResults.map((r) => ({
        rider_name: r.rider_name,
        finish_time_str: r.finish_time > 0 ? secondsToTimeStr(r.finish_time) : "",
      }))
    : [
        { rider_name: "", finish_time_str: "" },
        { rider_name: "", finish_time_str: "" },
        { rider_name: "", finish_time_str: "" },
      ];

  const [lines, setLines] = useState<ResultLine[]>(initialLines);
  const [raceTimeStr, setRaceTimeStr] = useState(
    existingRaceTime && existingRaceTime > 0 ? secondsToTimeStr(existingRaceTime) : "",
  );
  const [avgSpeedStr, setAvgSpeedStr] = useState(
    existingAvgSpeed && existingAvgSpeed > 0 ? String(existingAvgSpeed) : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  function updateLine(index: number, field: keyof ResultLine, value: string) {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, [field]: value } : line,
      ),
    );
  }

  function formatTimeInput(raw: string): string {
    // Strip everything except digits
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 0) return "";
    // Auto-insert colons:
    // 1-2 digits: SS
    // 3-4 digits: M:SS or MM:SS
    // 5-6 digits: H:MM:SS or HH:MM:SS
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) {
      const ss = digits.slice(-2);
      const mm = digits.slice(0, -2);
      return `${Number(mm)}:${ss}`;
    }
    const ss = digits.slice(-2);
    const mm = digits.slice(-4, -2);
    const hh = digits.slice(0, -4);
    return `${Number(hh)}:${mm}:${ss}`;
  }

  function handleTimeChange(index: number, raw: string) {
    const formatted = formatTimeInput(raw);
    updateLine(index, "finish_time_str", formatted);
  }

  function addLine() {
    setLines((prev) => [...prev, { rider_name: "", finish_time_str: "" }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const cameraInputRef = useRef<HTMLInputElement>(null);

  interface OcrResult {
    lines: ResultLine[];
    race_time_str: string;
    avg_speed: number;
  }

  async function processOcrFile(file: File): Promise<OcrResult> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/races/${raceId}/ocr`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      const lines = (data.results || []).map((r: any) => ({
        rider_name: r.rider_name || "",
        finish_time_str: r.finish_time_str || "",
      }));
      return {
        lines,
        race_time_str: data.race_time_str || "",
        avg_speed: Number(data.avg_speed) || 0,
      };
    } else {
      const err = await res.json();
      throw new Error(err.error || "Erreur lors de l'analyse");
    }
  }

  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        toast(`Format non supporte : ${file.name}`, "error");
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
    try {
      let allNewLines: ResultLine[] = [];
      let detectedRaceTime = "";
      let detectedAvgSpeed = 0;
      for (let i = 0; i < validFiles.length; i++) {
        if (validFiles.length > 1) {
          toast(`Analyse photo ${i + 1}/${validFiles.length}...`, "success");
        }
        const ocrResult = await processOcrFile(validFiles[i]);
        allNewLines = [...allNewLines, ...ocrResult.lines];
        // Keep first non-empty race_time and avg_speed detected
        if (!detectedRaceTime && ocrResult.race_time_str) {
          detectedRaceTime = ocrResult.race_time_str;
        }
        if (!detectedAvgSpeed && ocrResult.avg_speed > 0) {
          detectedAvgSpeed = ocrResult.avg_speed;
        }
      }

      // Auto-fill race time and avg speed if detected and not already set
      if (detectedRaceTime && !raceTimeStr) {
        setRaceTimeStr(detectedRaceTime);
      }
      if (detectedAvgSpeed > 0 && !avgSpeedStr) {
        setAvgSpeedStr(String(detectedAvgSpeed));
      }

      if (allNewLines.length > 0) {
        // Merge with existing non-empty lines + deduplicate by rider name
        const existingFilled = lines.filter((l) => l.rider_name.trim());
        const combined = [...existingFilled, ...allNewLines];

        // Deduplicate: keep first occurrence of each name (case-insensitive)
        const seen = new Set<string>();
        const deduped = combined.filter((l) => {
          const key = l.rider_name.trim().toLowerCase();
          if (!key) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const duplicatesRemoved = combined.length - deduped.length;
        setLines(deduped);
        toast(
          `${deduped.length} coureur(s) au total${duplicatesRemoved > 0 ? ` (${duplicatesRemoved} doublon(s) retire(s))` : ""} — verifie avant de publier`,
          "success",
        );
      } else {
        toast("Aucun resultat detecte", "error");
      }
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    // Filter out lines with at least a name
    const filledLines = lines.filter((l) => l.rider_name.trim());

    if (filledLines.length === 0) {
      toast("Ajoute au moins un resultat", "error");
      return;
    }

    // Parse times — time is optional (0 if empty)
    let hasInvalidTime = false;
    const results = filledLines.map((line, i) => {
      const timeStr = line.finish_time_str.trim();
      let seconds = 0;
      if (timeStr) {
        const parsed = parseTimeToSeconds(timeStr);
        if (parsed === null || parsed < 0) {
          hasInvalidTime = true;
          return null;
        }
        seconds = parsed;
      }
      return {
        position: i + 1,
        rider_name: line.rider_name.trim(),
        finish_time: seconds,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    if (hasInvalidTime) {
      toast("Format de temps invalide (utilise HH:MM:SS ou MM:SS)", "error");
      return;
    }

    // Parse race time
    let raceTimeSec = 0;
    if (raceTimeStr.trim()) {
      const parsed = parseTimeToSeconds(raceTimeStr.trim());
      if (parsed === null || parsed < 0) {
        toast("Temps de course invalide (utilise HH:MM:SS ou MM:SS)", "error");
        return;
      }
      raceTimeSec = parsed;
    }

    // Parse avg speed
    const avgSpeedNum = avgSpeedStr.trim() ? parseFloat(avgSpeedStr.trim()) : 0;
    if (avgSpeedStr.trim() && (isNaN(avgSpeedNum) || avgSpeedNum < 0)) {
      toast("Vitesse moyenne invalide", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/races/${raceId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, race_time: raceTimeSec, avg_speed: avgSpeedNum }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(
          isEditing
            ? "Resultats mis a jour !"
            : `Resultats publies ! ${data.ghost_count > 0 ? `${data.ghost_count} carte(s) fantome(s) creee(s)` : ""}`,
          "success",
        );
        onPublished();
      } else {
        const err = await res.json();
        toast(err.error || "Erreur lors de la publication", "error");
      }
    } catch {
      toast("Erreur reseau", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#94A3B8]">
          {isEditing ? "Modifier les resultats" : "Publier les resultats"}
        </h3>

        {/* OCR Upload Buttons */}
        <div className="flex items-center gap-2">
          {/* Camera button (mobile) */}
          <label
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-white/[0.10] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/90 ${ocrLoading ? "pointer-events-none opacity-50" : ""}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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

          {/* Gallery / file picker (multi-select) */}
          <label
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-white/[0.10] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/90 ${ocrLoading ? "pointer-events-none opacity-50" : ""}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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

      {/* Race time & average speed */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Temps de course
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="H MM SS"
            value={raceTimeStr}
            onChange={(e) => setRaceTimeStr(formatTimeInput(e.target.value))}
            className="w-28 rounded-lg border border-white/[0.08] bg-[#111827]/50 px-3 py-2 text-center text-sm text-white placeholder-[#475569] outline-none transition focus:border-[#6366F1]/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Vitesse moy. (km/h)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="42.5"
            value={avgSpeedStr}
            onChange={(e) => {
              // Allow only numbers and one decimal point
              const val = e.target.value.replace(/[^0-9.]/g, "");
              const parts = val.split(".");
              if (parts.length > 2) return;
              setAvgSpeedStr(val);
            }}
            className="w-28 rounded-lg border border-white/[0.08] bg-[#111827]/50 px-3 py-2 text-center text-sm text-white placeholder-[#475569] outline-none transition focus:border-[#6366F1]/50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Position number */}
            <span className="w-8 shrink-0 text-center text-sm font-bold text-[#94A3B8]">
              {i + 1}
            </span>

            {/* Rider name */}
            <input
              type="text"
              placeholder="Nom du coureur"
              value={line.rider_name}
              onChange={(e) => updateLine(i, "rider_name", e.target.value)}
              className="flex-1 rounded-lg border border-white/[0.08] bg-[#111827]/50 px-3 py-2 text-sm text-white placeholder-[#475569] outline-none transition focus:border-[#6366F1]/50"
            />

            {/* Time */}
            <input
              type="text"
              inputMode="numeric"
              placeholder="H MM SS"
              value={line.finish_time_str}
              onChange={(e) => handleTimeChange(i, e.target.value)}
              className="w-28 shrink-0 rounded-lg border border-white/[0.08] bg-[#111827]/50 px-3 py-2 text-center text-sm text-white placeholder-[#475569] outline-none transition focus:border-[#6366F1]/50"
            />

            {/* Remove button */}
            <button
              onClick={() => removeLine(i)}
              disabled={lines.length <= 1}
              className="shrink-0 rounded-lg p-2 text-[#475569] transition hover:bg-[#22223A]/60 hover:text-[#94A3B8] disabled:opacity-30"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={addLine}
          className="rounded-lg border border-dashed border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/80"
        >
          + Ajouter un coureur
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <p className="text-xs text-[#475569]">
          {isEditing
            ? "Les anciennes Ghost Cards seront remplacees"
            : "Les coureurs du Top 10 non-inscrits recevront une Ghost Card"}
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-50"
        >
          {submitting
            ? "Publication..."
            : isEditing
              ? "Mettre a jour"
              : "Publier les resultats"}
        </button>
      </div>
    </div>
  );
}
