import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchWeather,
  formatWeatherTemperature,
  isWeatherSnapshotStale,
  searchWeatherPlaces,
  weatherCondition,
} from "./weather";

const location = { name: "Baltimore", latitude: 39.29, longitude: -76.61 };

afterEach(() => vi.restoreAllMocks());

describe("weather helpers", () => {
  it("maps weather codes and formats temperatures for the selected units", () => {
    expect(weatherCondition(0)).toEqual({ label: "Clear sky", icon: "☀️" });
    expect(weatherCondition(95).label).toBe("Thunderstorms");
    expect(formatWeatherTemperature(71.6, "fahrenheit")).toBe("72°F");
    expect(formatWeatherTemperature(21.4, "celsius")).toBe("21°C");
  });

  it("marks missing and old readings as stale", () => {
    expect(isWeatherSnapshotStale(undefined)).toBe(true);
    expect(isWeatherSnapshotStale({ fetchedAt: "2026-09-14T10:00:00.000Z" }, new Date("2026-09-14T12:00:00.000Z"), 60 * 60 * 1000)).toBe(true);
    expect(isWeatherSnapshotStale({ fetchedAt: "2026-09-14T11:30:00.000Z" }, new Date("2026-09-14T12:00:00.000Z"), 60 * 60 * 1000)).toBe(false);
  });

  it("parses the forecast response without adding a dependency", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timezone: "America/New_York",
        current: { time: "2026-09-14T08:00", temperature_2m: 72.4, apparent_temperature: 73, weather_code: 1, is_day: 1, wind_speed_10m: 4.2 },
        daily: {
          time: ["2026-09-14", "2026-09-15"],
          weather_code: [1, 61],
          temperature_2m_max: [80, 75],
          temperature_2m_min: [64, 62],
          precipitation_probability_max: [10, 70],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWeather(location, "fahrenheit");

    expect(result.location.name).toBe("Baltimore");
    expect(result.timezone).toBe("America/New_York");
    expect(result.current.temperature).toBe(72.4);
    expect(result.daily[1].precipitationProbability).toBe(70);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("temperature_unit=fahrenheit"), expect.any(Object));
  });

  it("returns geocoding suggestions and ignores malformed results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [
        { id: 1, name: "Baltimore", latitude: 39.29, longitude: -76.61, country: "United States" },
        { name: "Missing coordinates" },
      ] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchWeatherPlaces("Baltimore");

    expect(results).toHaveLength(1);
    expect(results[0].country).toBe("United States");
  });
});
