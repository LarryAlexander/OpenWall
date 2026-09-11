import { afterEach, describe, expect, it } from "vitest";
import { DexieOpenWallRepository } from "./db";
import { createSampleHousehold } from "./sample";
import Dexie, { type EntityTable } from "dexie";
import type { Household, HouseholdMember, HouseholdTask, ScheduleItem, HistoryEntry, RewardLedgerEntry, Routine, PhotoAsset, BoardLayout } from "./types";

class TestDatabase extends Dexie {
  households!: EntityTable<Household, "id">;
  members!: EntityTable<HouseholdMember, "id">;
  scheduleItems!: EntityTable<ScheduleItem, "id">;
  tasks!: EntityTable<HouseholdTask, "id">;
  routines!: EntityTable<Routine, "id">;
  history!: EntityTable<HistoryEntry, "id">;
  rewards!: EntityTable<RewardLedgerEntry, "id">;
  photos!: EntityTable<PhotoAsset, "id">;
  boardLayouts!: EntityTable<BoardLayout, "id">;
  constructor() {
    super(`openwall-test-${crypto.randomUUID()}`);
    this.version(1).stores({
      households: "id, updatedAt",
      members: "id, householdId, sortOrder",
      scheduleItems: "id, householdId, startsAt, *memberIds",
      tasks: "id, householdId, dueDate, completedAt, *assigneeIds",
      routines: "id, householdId, frequency",
      history: "id, householdId, occurredAt, entityType",
      rewards: "id, householdId, memberId, createdAt",
      photos: "id, householdId, createdAt",
      boardLayouts: "id, householdId, updatedAt",
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

  it("persists routines and history alongside the household", async () => {
    const database = new TestDatabase();
    databases.push(database);
    const repository = new DexieOpenWallRepository(database as never);
    const sample = createSampleHousehold();
    const routine: Routine = {
      id: crypto.randomUUID(),
      householdId: sample.household.id,
      title: "Morning reset",
      assigneeIds: [sample.members[0].id],
      frequency: "daily",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.replace({ ...sample, routines: [routine] });
    const entry: HistoryEntry = {
      id: crypto.randomUUID(), householdId: sample.household.id, entityId: sample.tasks[0].id,
      entityType: "task", action: "completed", occurredAt: new Date().toISOString(),
      memberIds: sample.tasks[0].assigneeIds, summary: "Completed task",
    };
    await repository.saveHistory(entry);
    const loaded = await repository.load();
    expect(loaded?.routines).toEqual([routine]);
    expect(loaded?.history).toEqual([entry]);
  });

  it("persists board layout and local photo records", async () => {
    const database = new TestDatabase();
    databases.push(database);
    const repository = new DexieOpenWallRepository(database as never);
    const sample = createSampleHousehold();
    const widgets = [{ id: "note", type: "note" as const, x: 1, y: 2, w: 20, h: 20, tilt: 0 }];
    await repository.replace({ ...sample, boardWidgets: widgets });
    const photo: PhotoAsset = { id: crypto.randomUUID(), householdId: sample.household.id, name: "family.png", mimeType: "image/png", dataUrl: "data:image/png;base64,AA==", createdAt: new Date().toISOString() };
    await repository.savePhoto(photo);
    const loaded = await repository.load();
    expect(loaded?.boardWidgets).toEqual(widgets);
    expect(loaded?.photos).toEqual([photo]);
    await repository.deletePhoto(photo.id);
    expect((await repository.load())?.photos).toEqual([]);
  });
});
