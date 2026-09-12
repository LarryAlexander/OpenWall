import { describe, expect, it } from "vitest";
import { deriveAttentionItems, memberAttentionCount, visibleAttentionItems } from "./attention";
import { createEightPersonTestHousehold } from "./sample";
import type { AttentionState } from "./types";

describe("household attention", () => {
  it("derives overdue, due-today, and approval items", () => {
    const snapshot = createEightPersonTestHousehold();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    snapshot.tasks[0].dueDate = today;
    snapshot.tasks[1].dueDate = "2000-01-01";
    snapshot.rewards = [{ id: "pending", householdId: snapshot.household.id, memberId: snapshot.members[3].id, points: 5, reason: "Completed a chore", status: "pending", createdAt: now.toISOString() }];
    const items = deriveAttentionItems(snapshot, now);
    expect(items.some((item) => item.reason === "due-today")).toBe(true);
    expect(items.some((item) => item.reason === "overdue")).toBe(true);
    expect(items.some((item) => item.reason === "approval-needed")).toBe(true);
  });

  it("hides snoozed and acknowledged items and counts by role", () => {
    const snapshot = createEightPersonTestHousehold();
    const now = new Date();
    snapshot.tasks[0].dueDate = now.toISOString().slice(0, 10);
    const items = deriveAttentionItems(snapshot, now);
    const state: AttentionState = { id: items[0].id, householdId: snapshot.household.id, sourceType: items[0].sourceType, sourceId: items[0].sourceId, acknowledgedAt: now.toISOString(), updatedAt: now.toISOString() };
    expect(visibleAttentionItems(items, [state], now)).not.toContain(items[0]);
    const parent = snapshot.members.find((member) => member.role === "parent")!;
    expect(memberAttentionCount(parent, items)).toBe(items.length);
    const child = snapshot.members.find((member) => member.role === "child")!;
    expect(memberAttentionCount(child, items)).toBeLessThanOrEqual(items.length);
  });
});
