"use client";

import { FRENCH_REGIONS } from "@/types";
import type { FrenchRegion } from "@/types";

interface RegionSelectorProps {
  value: FrenchRegion | null;
  onChange: (region: FrenchRegion) => void;
  disabled?: boolean;
}

export default function RegionSelector({
  value,
  onChange,
  disabled,
}: RegionSelectorProps) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value as FrenchRegion)}
      disabled={disabled}
      className="rounded-lg border border-white/[0.08] bg-[#111827] px-3 py-2 text-sm text-white focus:border-[#6366F1]/50 focus:outline-none disabled:opacity-50"
    >
      <option value="" disabled>
        Choisis ta région
      </option>
      {FRENCH_REGIONS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
