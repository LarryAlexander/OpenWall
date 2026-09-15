import { describe, expect, it } from "vitest";
import { dateKeysFrom, scheduleOccursOnDate } from "./planning";
import type { ScheduleItem } from "./types";

const event = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({
  id: "event-1",
  householdId: "home-1",
  title: "School pickup",
  memberIds: ["member-1"],
  startsAt: "2026-09-14T15:00:00.000Z",
  endsAt: "2026-09-14T16:00:00.000Z",
  allDay: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  calendarDate: "2026-09-14",
  ...overrides,
});

describe("planning dates", () => {
  it("creates consecutive local calendar keys", () => {
    expect(dateKeysFrom(new Date("2026-09-13T12:00:00"), 3)).toEqual([
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });

  it("expands daily and weekly schedule recurrence without showing dates before the start", () => {
    expect(scheduleOccursOnDate(event({ recurrence: { frequency: "daily" } }), "2026-09-13")).toBe(false);
    expect(scheduleOccursOnDate(event({ recurrence: { frequency: "daily" } }), "2026-09-16")).toBe(true);
    expect(scheduleOccursOnDate(event({ recurrence: { frequency: "weekly", weekdays: [1] } }), "2026-09-21")).toBe(true);
    expect(scheduleOccursOnDate(event({ recurrence: { frequency: "weekly", weekdays: [1] } }), "2026-09-22")).toBe(false);
  });

  it("honors recurrence intervals and end dates", () => {
    const recurring = event({ recurrence: { frequency: "daily", interval: 2, until: "2026-09-18" } });
    expect(scheduleOccursOnDate(recurring, "2026-09-14")).toBe(true);
    expect(scheduleOccursOnDate(recurring, "2026-09-15")).toBe(false);
    expect(scheduleOccursOnDate(recurring, "2026-09-18")).toBe(true);
    expect(scheduleOccursOnDate(recurring, "2026-09-20")).toBe(false);
  });
});
