import { describe, expect, it } from "vitest";
import { parseBackup, serializeBackup } from "./backup";
import { createEightPersonTestHousehold, createSampleHousehold } from "./sample";

describe("OpenWall backup", () => {
  it("round-trips a household snapshot", () => {
    const household = createSampleHousehold();
    expect(parseBackup(serializeBackup(household))).toEqual(household);
  });

  it("rejects unknown backup formats", () => {
    expect(() => parseBackup(JSON.stringify({ format: "something-else" }))).toThrow();
  });

  it("rejects records from a different household", () => {
    const household = createSampleHousehold();
    const payload = JSON.parse(serializeBackup(household));
    payload.tasks[0].householdId = "another-home";
    expect(() => parseBackup(JSON.stringify(payload))).toThrow("mixed households");
  });

  it("preserves expanded member and schedule metadata", () => {
    const household = createEightPersonTestHousehold();
    const boardWidgets = [{ id: "welcome", type: "welcome" as const, x: 1, y: 1, w: 20, h: 20, tilt: 0 }];
    const restored = parseBackup(serializeBackup(household, boardWidgets));
    expect(restored.members).toHaveLength(8);
    expect(restored.members.some((member) => member.role === "parent")).toBe(true);
    expect(restored.scheduleItems.some((item) => item.kind === "school-closure")).toBe(true);
    expect(restored.routines).toHaveLength(2);
    expect(restored.boardWidgets).toEqual(boardWidgets);
    expect(restored.lists).toHaveLength(1);
    expect(restored.routineOccurrences).toHaveLength(2);
    expect(restored.history?.length).toBeGreaterThan(0);
  });

  it("preserves cached weather widget data for offline display", () => {
    const household = createSampleHousehold();
    const weather = {
      id: "weather-card",
      type: "weather" as const,
      x: 10,
      y: 10,
      w: 24,
      h: 30,
      tilt: 0,
      weather: {
        units: "fahrenheit" as const,
        location: { name: "Baltimore", latitude: 39.29, longitude: -76.61, country: "United States" },
        snapshot: {
          location: { name: "Baltimore", latitude: 39.29, longitude: -76.61, country: "United States" },
          fetchedAt: "2026-09-14T12:00:00.000Z",
          timezone: "America/New_York",
          units: "fahrenheit" as const,
          current: { time: "2026-09-14T08:00", temperature: 72, apparentTemperature: 73, weatherCode: 1, isDay: true, windSpeed: 4 },
          daily: [{ date: "2026-09-14", weatherCode: 1, temperatureMax: 80, temperatureMin: 64, precipitationProbability: 10 }],
        },
      },
    };
    const restored = parseBackup(serializeBackup(household, [weather]));
    expect(restored.boardWidgets?.[0]).toEqual(weather);
  });
});
