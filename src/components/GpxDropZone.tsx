"use client";

import { useRef, useState, useCallback } from "react";
import { parseGpx, computeRouteSummary } from "@/lib/gpx";
import { IconCheck } from "@/components/icons/VeloIcons";
import type { RouteSummary } from "@/types";

interface GpxDropZoneProps {
  onRouteParsed: (summary: RouteSummary) => void;
}

export default function GpxDropZone({ onRouteParsed }: GpxDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith(".gpx")) {
        setError("Fichier invalide — seuls les fichiers .gpx sont acceptés");
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
    [onRouteParsed],
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

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
          dragging
            ? "drop-zone-active border-yellow-500/60 bg-yellow-500/5"
            : "border-white/[0.08] bg-[#111827]/50 hover:border-[#6366F1]/30 hover:bg-[#1A1A2E]/60"
        }`}
      >
        {/* Upload icon */}
        <svg
          className="mb-3 h-10 w-10 text-[#94A3B8]"
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

        {fileName ? (
          <p className="text-sm text-emerald-400">
            <IconCheck size={14} className="inline-block mr-1 text-emerald-400" />{fileName}
          </p>
        ) : (
          <>
            <p className="text-sm text-[#94A3B8]">
              Glisse ton fichier <strong>.gpx</strong> ici
            </p>
            <p className="mt-1 text-xs text-[#475569]">
              ou clique pour parcourir
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
