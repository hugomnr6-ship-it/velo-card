"use client";

import { useRef, useState, useCallback } from "react";
import { parseGpx, computeRouteSummary } from "@/lib/gpx";
import { IconCheck } from "@/components/icons/VeloIcons";
import type { RouteSummary } from "@/types";

interface GpxDropZoneProps {
  onRouteParsed: (summary: RouteSummary) => void;
  variant?: "hero" | "compact";
  fileName?: string;
}

export default function GpxDropZone({
  onRouteParsed,
  variant = "hero",
  fileName: externalFileName,
}: GpxDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(externalFileName ?? null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith(".gpx")) {
        setError("Fichier invalide — seuls les fichiers .gpx sont acceptes");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const xml = e.target?.result as string;
          const points = parseGpx(xml);
          const summary = computeRouteSummary(points);
          setFileName(file.name);
          onRouteParsed(summary);
        } catch (err: any) {
          setError(err.message || "Erreur lors du parsing GPX");
        }
      };
      reader.readAsText(file);
    },
    [onRouteParsed]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleClick() {
    inputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const displayName = externalFileName || fileName;

  // ═══ Compact variant ═══
  if (variant === "compact") {
    return (
      <div>
        <div
          onClick={handleClick}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.06] bg-[#16161F]/80 px-3 py-2 transition active:scale-[0.98]"
        >
          {displayName ? (
            <>
              <IconCheck size={14} className="shrink-0 text-emerald-400" />
              <span className="flex-1 truncate text-xs text-white/60 font-mono">
                {displayName}
              </span>
              <span className="shrink-0 rounded-md bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-[#6366F1]">
                Changer
              </span>
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4 shrink-0 text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="flex-1 text-xs text-white/30">
                Importer un .gpx
              </span>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".gpx"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
        {error && (
          <p className="mt-1 text-center text-[10px] text-red-400">{error}</p>
        )}
      </div>
    );
  }

  // ═══ Hero variant ═══
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all ${
          dragging
            ? "border-[#6366F1]/60 bg-[#6366F1]/5"
            : "border-white/[0.08] bg-[#16161F]/50 active:bg-[#1A1A2E]/60"
        }`}
      >
        {/* Upload icon */}
        <svg
          className="mb-4 h-12 w-12 text-[#6366F1]/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {displayName ? (
          <div className="flex items-center gap-2">
            <IconCheck size={16} className="text-emerald-400" />
            <p className="text-sm font-mono text-emerald-400">{displayName}</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-white/50">
              Glisse ton fichier <span className="text-[#6366F1]">.gpx</span> ici
            </p>
            <p className="mt-1 text-xs text-white/20">
              ou appuie pour parcourir
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".gpx"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-2 text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
