import { describe, expect, it } from "vitest";
import { formatDate } from "./date";

describe("formatDate", () => {
  const date = new Date(2026, 8, 17, 9, 30);

  it("formats traditional calendar labels as dates instead of times", () => {
    expect(formatDate(date, "d")).toBe("17");
    expect(formatDate(date, "MMM d")).toMatch(/Sep 17/);
    expect(formatDate(date, "MMMM yyyy")).toMatch(/September 2026/);
    expect(formatDate(date, "MMMM d, yyyy")).toMatch(/September 17, 2026/);
  });

  it("formats combined date and time labels", () => {
    expect(formatDate(date, "MMM d · h:mm a")).toMatch(/Sep 17 · 9:30 AM/i);
    expect(formatDate(date, "EEE, MMM d · h:mm a")).toMatch(/Thu, Sep 17 · 9:30 AM/i);
  });
});
