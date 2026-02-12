"use client";

import { useRef, useState, useCallback } from "react";
import { parseGpx, computeRouteSummary } from "@/lib/gpx";
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
            : "border-neutral-700 bg-neutral-900/50 hover:border-neutral-500 hover:bg-neutral-800/50"
        }`}
      >
        {/* Upload icon */}
        <svg
          className="mb-3 h-10 w-10 text-neutral-500"
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
            ✓ {fileName}
          </p>
        ) : (
          <>
            <p className="text-sm text-neutral-400">
              Glisse ton fichier <strong>.gpx</strong> ici
            </p>
            <p className="mt-1 text-xs text-neutral-600">
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
