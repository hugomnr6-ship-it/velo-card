"use client";

import type { WeatherData, CardTier } from "@/types";

interface WeatherPanelProps {
  weather: WeatherData;
  tier: CardTier;
}

const tierAccent: Record<CardTier, string> = {
  bronze: "text-amber-400",
  silver: "text-slate-200",
  gold: "text-yellow-300",
};

export default function WeatherPanel({ weather, tier }: WeatherPanelProps) {
  const accent = tierAccent[tier];

  return (
    <div className="flex-1 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
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
          <p className="text-xs text-neutral-500">Vent</p>

          {/* Temperature + description */}
          <p className="mt-2 text-sm text-neutral-300">
            {weather.temperature}°C — {weather.description}
          </p>
        </div>
      </div>
    </div>
  );
}
