import { describe, expect, it } from "vitest";
import { parseBackup, serializeBackup } from "./backup";
import { createSampleHousehold } from "./sample";

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
});
