import { afterEach, describe, expect, it } from "vitest";
import { DexieOpenWallRepository } from "./db";
import { createSampleHousehold } from "./sample";
import Dexie, { type EntityTable } from "dexie";
import type { Household, HouseholdMember, HouseholdTask, ScheduleItem } from "./types";

class TestDatabase extends Dexie {
  households!: EntityTable<Household, "id">;
  members!: EntityTable<HouseholdMember, "id">;
  scheduleItems!: EntityTable<ScheduleItem, "id">;
  tasks!: EntityTable<HouseholdTask, "id">;
  constructor() {
    super(`openwall-test-${crypto.randomUUID()}`);
    this.version(1).stores({
      households: "id, updatedAt",
      members: "id, householdId, sortOrder",
      scheduleItems: "id, householdId, startsAt, *memberIds",
      tasks: "id, householdId, dueDate, completedAt, *assigneeIds",
    });
  }
}

const databases: TestDatabase[] = [];
afterEach(async () => Promise.all(databases.map((database) => database.delete())));

describe("DexieOpenWallRepository", () => {
  it("persists and reloads a complete household", async () => {
    const database = new TestDatabase();
    databases.push(database);
    const repository = new DexieOpenWallRepository(database as never);
    const sample = createSampleHousehold();
    await repository.replace(sample);
    const loaded = await repository.load();
    expect(loaded?.household).toEqual(sample.household);
    expect(loaded?.members).toEqual(sample.members);
    expect(loaded?.scheduleItems).toEqual(sample.scheduleItems);
    expect([...(loaded?.tasks ?? [])].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      [...sample.tasks].sort((a, b) => a.id.localeCompare(b.id)),
    );
  });

  it("toggles task completion without changing other data", async () => {
    const database = new TestDatabase();
    databases.push(database);
    const repository = new DexieOpenWallRepository(database as never);
    const sample = createSampleHousehold();
    await repository.replace(sample);
    const updated = { ...sample.tasks[0], completedAt: new Date().toISOString() };
    await repository.saveTask(updated);
    const loaded = await repository.load();
    expect(loaded?.tasks.find((task) => task.id === updated.id)?.completedAt).toBe(
      updated.completedAt,
    );
    expect(loaded?.scheduleItems).toHaveLength(sample.scheduleItems.length);
  });
});
