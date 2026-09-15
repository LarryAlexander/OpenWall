import { describe, expect, it } from "vitest";
import { DEFAULT_DISPLAY_SCHEDULE, displayModeAt, formatNextDisplayWindow } from "./displaySchedule";

describe("display schedule", () => {
  it("keeps the default schedule disabled", () => {
    expect(displayModeAt(new Date("2026-09-14T12:00:00"), DEFAULT_DISPLAY_SCHEDULE)).toBe("normal");
  });

  it("recognizes focus and overnight sleep windows", () => {
    const schedule = { ...DEFAULT_DISPLAY_SCHEDULE, enabled: true };
    expect(displayModeAt(new Date("2026-09-14T12:00:00"), schedule)).toBe("focus");
    expect(displayModeAt(new Date("2026-09-14T23:30:00"), schedule)).toBe("sleep");
    expect(displayModeAt(new Date("2026-09-14T05:45:00"), schedule)).toBe("sleep");
    expect(displayModeAt(new Date("2026-09-14T07:00:00"), schedule)).toBe("normal");
  });

  it("finds the next end of the active display window", () => {
    const schedule = { ...DEFAULT_DISPLAY_SCHEDULE, enabled: true };
    const next = formatNextDisplayWindow(new Date(2026, 8, 14, 23, 30), schedule, "sleep");
    expect(next.getDate()).toBe(15);
    expect(next.getHours()).toBe(6);
    expect(next.getMinutes()).toBe(30);
  });
});
