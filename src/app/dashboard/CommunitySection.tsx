"use client";

import { useState, useEffect } from "react";
import RegionSelector from "@/components/RegionSelector";
import { useToast } from "@/contexts/ToastContext";
import type { FrenchRegion } from "@/types";

export default function CommunitySection() {
  const { toast } = useToast();
  const [region, setRegion] = useState<FrenchRegion | null>(null);
  const [regionSaving, setRegionSaving] = useState(false);

  // Fetch user region on mount
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.region) setRegion(data.region);
      })
      .catch(() => {});
  }, []);

  async function handleRegionChange(newRegion: FrenchRegion) {
    const previousRegion = region;
    setRegion(newRegion);
    setRegionSaving(true);
    try {
      const res = await fetch("/api/profile/region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: newRegion }),
      });
      if (!res.ok) throw new Error("Erreur sauvegarde");
    } catch {
      setRegion(previousRegion);
      toast("Impossible de sauvegarder la region", "error");
    } finally {
      setRegionSaving(false);
    }
  }

  return (
    <section className="mt-8 w-full max-w-2xl">
      {/* Section divider */}
      <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <h2 className="mb-4 text-center text-lg font-bold tracking-wide text-white">
        Communauté
      </h2>

      {/* Region selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#94A3B8]">Ma région :</span>
        <RegionSelector
          value={region}
          onChange={handleRegionChange}
          disabled={regionSaving}
        />
        {regionSaving && (
          <span className="text-xs text-[#94A3B8]">Sauvegarde...</span>
        )}
      </div>
    </section>
  );
}
