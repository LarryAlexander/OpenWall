import { describe, expect, it } from "vitest";
import { currentStreak, levelForStars, requiresRewardApproval, rewardBalance, taskStarValue } from "./rewards";
import type { HouseholdMember, HouseholdTask } from "./types";

const member: HouseholdMember = { id: "m1", householdId: "h1", name: "Ari", colorToken: "sage", symbol: "A", sortOrder: 0, role: "child" };
const task = (date: string, completed = true): HouseholdTask => ({ id: crypto.randomUUID(), householdId: "h1", title: "Chore", assigneeIds: [member.id], dueDate: date, completedAt: completed ? `${date}T12:00:00.000Z` : undefined, createdAt: `${date}T10:00:00.000Z`, updatedAt: `${date}T10:00:00.000Z`, starValue: 10 });

describe("family rewards", () => {
  it("uses configurable task values and approval defaults", () => {
    expect(taskStarValue(task("2026-09-10"))).toBe(10);
    expect(requiresRewardApproval(member)).toBe(true);
    expect(levelForStars(340)).toBe(4);
  });

  it("calculates a non-negative balance and current streak", () => {
    const tasks = [task("2026-09-08"), task("2026-09-09"), task("2026-09-10")];
    expect(rewardBalance(member.id, tasks, [{ id: "r", householdId: "h1", memberId: member.id, points: -5, reason: "Correction", createdAt: "2026-09-10T13:00:00.000Z", status: "approved" }])).toBe(25);
    expect(currentStreak(member.id, tasks, new Date("2026-09-10T18:00:00.000Z"))).toBe(3);
    expect(rewardBalance(member.id, [], [{ id: "r", householdId: "h1", memberId: member.id, points: -5, reason: "Correction", createdAt: "2026-09-10T13:00:00.000Z", status: "approved" }])).toBe(0);
    expect(rewardBalance(member.id, [task("2026-09-10")], [{ id: "award", householdId: "h1", memberId: member.id, points: 10, reason: "Completed Chore", sourceTaskId: "missing" , createdAt: "2026-09-10T13:00:00.000Z", status: "approved" }])).toBe(20);
  });
});
