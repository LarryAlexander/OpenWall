import { describe, expect, it } from "vitest";
import { createEightPersonTestHousehold } from "./sample";

describe("eight-person testing household", () => {
  it("creates a dense, fictional fixture with eight members", () => {
    const snapshot = createEightPersonTestHousehold();
    expect(snapshot.household.name).toContain("Test Bench");
    expect(snapshot.members).toHaveLength(8);
    expect(new Set(snapshot.members.map((member) => member.id)).size).toBe(8);
    expect(snapshot.scheduleItems.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.tasks.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.scheduleItems.some((item) => item.kind === "school-closure")).toBe(true);
    expect(snapshot.scheduleItems.some((item) => item.startsAt > new Date().toISOString())).toBe(true);
  });

  it("creates fresh records each time", () => {
    const first = createEightPersonTestHousehold();
    const second = createEightPersonTestHousehold();
    expect(first.household.id).not.toBe(second.household.id);
    expect(first.members[0].id).not.toBe(second.members[0].id);
  });
});
