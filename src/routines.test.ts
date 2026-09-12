import { describe, expect, it } from "vitest";
import { makeRoutineOccurrence, routineOccursOnDate } from "./routines";
import type { Routine } from "./types";

const routine = (overrides: Partial<Routine> = {}): Routine => ({
  id: "routine-1",
  householdId: "home-1",
  title: "Morning reset",
  assigneeIds: ["member-1"],
  frequency: "weekly",
  weekdays: [1],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

describe("routine scheduling", () => {
  it("honors weekly weekdays and explicit exceptions", () => {
    expect(routineOccursOnDate(routine(), "2026-09-07")).toBe(true); // Monday
    expect(routineOccursOnDate(routine(), "2026-09-08")).toBe(false);
    expect(routineOccursOnDate(routine({ skippedDates: ["2026-09-07"] }), "2026-09-07")).toBe(false);
  });

  it("creates stable task and occurrence records for a date", () => {
    const result = makeRoutineOccurrence(routine({ frequency: "daily", weekdays: undefined }), "2026-09-12", new Date("2026-09-12T12:00:00.000Z"));
    expect(result.task.id).toBe("occurrence-routine-1-2026-09-12");
    expect(result.task.occurrenceDate).toBe("2026-09-12");
    expect(result.occurrence.status).toBe("pending");
  });

  it("moves a recurring occurrence to its rescheduled date", () => {
    const moved = routine({
      exceptions: [{ date: "2026-09-07", action: "reschedule", rescheduledDate: "2026-09-09" }],
    });
    expect(routineOccursOnDate(moved, "2026-09-07")).toBe(false);
    expect(routineOccursOnDate(moved, "2026-09-09")).toBe(true);
  });
});
