import { handleApiError } from "@/lib/api-utils";

/**
 * POST /api/weather/forecast
 * Fetches weather forecast for a specific date and location from Open-Meteo.
 * Input: { lat: number, lon: number, date: string (YYYY-MM-DD) }
 * Output: { temperature, temperatureMax, temperatureMin, windSpeed, windGusts, windDirection, precipitation, weatherCode, description }
 */
export async function POST(request: Request) {
  try {
    const { lat, lon, date } = await request.json();

    if (typeof lat !== "number" || typeof lon !== "number" || !date) {
      return Response.json({ error: "lat, lon et date requis" }, { status: 400 });
    }

    // Open-Meteo free API — no key needed
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,weather_code&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code&timezone=Europe%2FParis&start_date=${date}&end_date=${date}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) {
      return Response.json({ error: "Open-Meteo API error" }, { status: 502 });
    }

    const data = await res.json();
    const daily = data.daily;
    const hourly = data.hourly;

    if (!daily || !daily.time || daily.time.length === 0) {
      return Response.json({ error: "Pas de données pour cette date" }, { status: 404 });
    }

    // WMO weather codes to descriptions
    const weatherCodeToDesc: Record<number, string> = {
      0: "Ciel dégagé",
      1: "Principalement dégagé",
      2: "Partiellement nuageux",
      3: "Couvert",
      45: "Brouillard",
      48: "Brouillard givrant",
      51: "Bruine légère",
      53: "Bruine modérée",
      55: "Bruine forte",
      61: "Pluie légère",
      63: "Pluie modérée",
      65: "Pluie forte",
      71: "Neige légère",
      73: "Neige modérée",
      75: "Neige forte",
      80: "Averses légères",
      81: "Averses modérées",
      82: "Averses fortes",
      85: "Averses de neige",
      95: "Orage",
      96: "Orage avec grêle légère",
      99: "Orage avec grêle forte",
    };

    const weatherCode = daily.weather_code?.[0] ?? 0;

    // Build hourly data for the riding hours (7h-18h)
    const hourlyData = [];
    if (hourly?.time) {
      for (let i = 0; i < hourly.time.length; i++) {
        const hour = new Date(hourly.time[i]).getHours();
        if (hour >= 7 && hour <= 18) {
          hourlyData.push({
            hour,
            temperature: hourly.temperature_2m?.[i] ?? null,
            windSpeed: hourly.wind_speed_10m?.[i] ?? null,
            windDirection: hourly.wind_direction_10m?.[i] ?? null,
            windGusts: hourly.wind_gusts_10m?.[i] ?? null,
            precipitation: hourly.precipitation?.[i] ?? null,
            weatherCode: hourly.weather_code?.[i] ?? 0,
          });
        }
      }
    }

    const forecast = {
      date: daily.time[0],
      temperatureMax: daily.temperature_2m_max?.[0] ?? null,
      temperatureMin: daily.temperature_2m_min?.[0] ?? null,
      precipitation: daily.precipitation_sum?.[0] ?? 0,
      windSpeed: daily.wind_speed_10m_max?.[0] ?? 0,
      windGusts: daily.wind_gusts_10m_max?.[0] ?? 0,
      windDirection: daily.wind_direction_10m_dominant?.[0] ?? 0,
      weatherCode,
      description: weatherCodeToDesc[weatherCode] || "Inconnu",
      hourly: hourlyData,
    };

    return Response.json(forecast);
  } catch (err) {
    return handleApiError(err, "WEATHER_FORECAST");
  }
}
