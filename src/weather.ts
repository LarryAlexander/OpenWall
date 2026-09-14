import type {
  WeatherForecastDay,
  WeatherLocation,
  WeatherSnapshot,
  WeatherUnits,
} from "./types";

export const WEATHER_FORECAST_DAYS = 5;
export const WEATHER_STALE_AFTER_MS = 3 * 60 * 60 * 1000;
export const WEATHER_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
export const WEATHER_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export interface WeatherPlace extends WeatherLocation {
  id?: number;
}

export interface WeatherCondition {
  label: string;
  icon: string;
}

type WeatherApiResponse = {
  timezone?: unknown;
  current?: {
    time?: unknown;
    temperature_2m?: unknown;
    apparent_temperature?: unknown;
    weather_code?: unknown;
    is_day?: unknown;
    wind_speed_10m?: unknown;
  };
  daily?: {
    time?: unknown;
    weather_code?: unknown;
    temperature_2m_max?: unknown;
    temperature_2m_min?: unknown;
    precipitation_probability_max?: unknown;
  };
};

const numberValue = (value: unknown, field: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Weather response is missing ${field}.`);
  }
  return value;
};

const stringValue = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Weather response is missing ${field}.`);
  }
  return value;
};

const arrayValue = (value: unknown, field: string) => {
  if (!Array.isArray(value)) throw new Error(`Weather response is missing ${field}.`);
  return value;
};

export function weatherCondition(code: number): WeatherCondition {
  if (code === 0) return { label: "Clear sky", icon: "☀️" };
  if (code <= 3) return { label: "Partly cloudy", icon: "⛅" };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "🌫️" };
  if (code <= 57) return { label: "Light drizzle", icon: "🌦️" };
  if (code <= 67) return { label: "Rain", icon: "🌧️" };
  if (code <= 77) return { label: "Snow", icon: "❄️" };
  if (code <= 82) return { label: "Rain showers", icon: "🌦️" };
  if (code <= 86) return { label: "Snow showers", icon: "🌨️" };
  if (code >= 95) return { label: "Thunderstorms", icon: "⛈️" };
  return { label: "Mixed conditions", icon: "🌤️" };
}

export function formatWeatherTemperature(value: number, units: WeatherUnits) {
  return `${Math.round(value)}°${units === "fahrenheit" ? "F" : "C"}`;
}

export function isWeatherSnapshotStale(
  snapshot: Pick<WeatherSnapshot, "fetchedAt"> | undefined,
  now = new Date(),
  maxAgeMs = WEATHER_STALE_AFTER_MS,
) {
  if (!snapshot) return true;
  const fetchedAt = new Date(snapshot.fetchedAt).getTime();
  return !Number.isFinite(fetchedAt) || now.getTime() - fetchedAt > maxAgeMs;
}

export function locationLabel(location: WeatherLocation) {
  return [location.name, location.admin1, location.country]
    .filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index)
    .join(", ");
}

export async function fetchWeather(
  location: WeatherLocation,
  units: WeatherUnits,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: String(WEATHER_FORECAST_DAYS),
    timezone: "auto",
    temperature_unit: units,
    wind_speed_unit: units === "fahrenheit" ? "mph" : "kmh",
  });
  const response = await fetch(`${WEATHER_FORECAST_URL}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}.`);
  const data = (await response.json()) as WeatherApiResponse;
  const current = data.current;
  const daily = data.daily;
  if (!current || !daily) throw new Error("Weather response was incomplete.");

  const dates = arrayValue(daily.time, "daily dates");
  const codes = arrayValue(daily.weather_code, "daily conditions");
  const highs = arrayValue(daily.temperature_2m_max, "daily highs");
  const lows = arrayValue(daily.temperature_2m_min, "daily lows");
  const rain = arrayValue(daily.precipitation_probability_max, "daily precipitation");
  const days: WeatherForecastDay[] = dates.slice(0, WEATHER_FORECAST_DAYS).map((date, index) => ({
    date: stringValue(date, "a forecast date"),
    weatherCode: numberValue(codes[index], "a forecast condition"),
    temperatureMax: numberValue(highs[index], "a forecast high"),
    temperatureMin: numberValue(lows[index], "a forecast low"),
    precipitationProbability: numberValue(rain[index] ?? 0, "a precipitation probability"),
  }));

  return {
    location: { ...location, timezone: typeof data.timezone === "string" ? data.timezone : location.timezone },
    fetchedAt: new Date().toISOString(),
    timezone: typeof data.timezone === "string" && data.timezone ? data.timezone : location.timezone ?? "auto",
    units,
    current: {
      time: stringValue(current.time, "current time"),
      temperature: numberValue(current.temperature_2m, "current temperature"),
      apparentTemperature: numberValue(current.apparent_temperature, "feels-like temperature"),
      weatherCode: numberValue(current.weather_code, "current condition"),
      isDay: Boolean(numberValue(current.is_day, "daylight state")),
      windSpeed: numberValue(current.wind_speed_10m, "wind speed"),
    },
    daily: days,
  };
}

export async function searchWeatherPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<WeatherPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const params = new URLSearchParams({
    name: trimmed,
    count: "5",
    language: "en",
    format: "json",
  });
  const response = await fetch(`${WEATHER_GEOCODING_URL}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error(`Location search returned ${response.status}.`);
  const data = (await response.json()) as { results?: unknown };
  if (!Array.isArray(data.results)) return [];
  return data.results.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const result = value as Record<string, unknown>;
    if (typeof result.name !== "string" || typeof result.latitude !== "number" || typeof result.longitude !== "number") return [];
    return [{
      id: typeof result.id === "number" ? result.id : undefined,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: typeof result.timezone === "string" ? result.timezone : undefined,
      country: typeof result.country === "string" ? result.country : undefined,
      admin1: typeof result.admin1 === "string" ? result.admin1 : undefined,
    } satisfies WeatherPlace];
  });
}
