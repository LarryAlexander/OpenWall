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
  });
});
