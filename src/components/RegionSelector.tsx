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
      className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none disabled:opacity-50"
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
