"use client";

import type { WeatherData, CardTier } from "@/types";

interface WeatherPanelProps {
  weather: WeatherData;
  tier: CardTier;
}

const tierAccent: Record<CardTier, string> = {
  bronze: "text-amber-400",
  argent: "text-slate-200",
  platine: "text-[#E0E8F0]",
  diamant: "text-[#B9F2FF]",
  legende: "text-yellow-300",
};

export default function WeatherPanel({ weather, tier }: WeatherPanelProps) {
  const accent = tierAccent[tier];

  return (
    <div className="flex-1 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
        Météo au centre du parcours
      </p>

      <div className="flex items-center gap-4">
        {/* Weather icon from OpenWeatherMap */}
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="h-14 w-14 opacity-80"
        />

        <div className="flex-1">
          {/* Wind */}
          <p className={`text-lg font-bold ${accent}`}>
            {weather.windSpeedKmh} km/h {weather.windDirection}
          </p>
          <p className="text-xs text-[#94A3B8]">Vent</p>

          {/* Temperature + description */}
          <p className="mt-2 text-sm text-white/80">
            {weather.temperature}°C — {weather.description}
          </p>
        </div>
      </div>
    </div>
  );
}
