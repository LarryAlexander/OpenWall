import Dexie, { type EntityTable } from "dexie";
import type {
  Household,
  HouseholdMember,
  HouseholdSnapshot,
  HouseholdTask,
  ScheduleItem,
} from "./types";

class OpenWallDatabase extends Dexie {
  households!: EntityTable<Household, "id">;
  members!: EntityTable<HouseholdMember, "id">;
  scheduleItems!: EntityTable<ScheduleItem, "id">;
  tasks!: EntityTable<HouseholdTask, "id">;

  constructor(name = "openwall") {
    super(name);
    this.version(1).stores({
      households: "id, updatedAt",
      members: "id, householdId, sortOrder",
      scheduleItems: "id, householdId, startsAt, *memberIds",
      tasks: "id, householdId, dueDate, completedAt, *assigneeIds",
    });
  }
}

export const db = new OpenWallDatabase();

export interface OpenWallRepository {
  load(): Promise<HouseholdSnapshot | null>;
  replace(snapshot: HouseholdSnapshot): Promise<void>;
  saveHousehold(household: Household): Promise<void>;
  saveMember(member: HouseholdMember): Promise<void>;
  deleteMember(id: string): Promise<void>;
  saveScheduleItem(item: ScheduleItem): Promise<void>;
  deleteScheduleItem(id: string): Promise<void>;
  saveTask(task: HouseholdTask): Promise<void>;
  deleteTask(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class DexieOpenWallRepository implements OpenWallRepository {
  constructor(private readonly database: OpenWallDatabase = db) {}

  async load(): Promise<HouseholdSnapshot | null> {
    const household = await this.database.households.orderBy("updatedAt").last();
    if (!household) return null;

    const [members, scheduleItems, tasks] = await Promise.all([
      this.database.members.where("householdId").equals(household.id).sortBy("sortOrder"),
      this.database.scheduleItems.where("householdId").equals(household.id).sortBy("startsAt"),
      this.database.tasks.where("householdId").equals(household.id).toArray(),
    ]);

    return { household, members, scheduleItems, tasks };
  }

  async replace(snapshot: HouseholdSnapshot): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.households,
      this.database.members,
      this.database.scheduleItems,
      this.database.tasks,
      async () => {
        await Promise.all([
          this.database.households.clear(),
          this.database.members.clear(),
          this.database.scheduleItems.clear(),
          this.database.tasks.clear(),
        ]);
        await this.database.households.add(snapshot.household);
        await this.database.members.bulkAdd(snapshot.members);
        await this.database.scheduleItems.bulkAdd(snapshot.scheduleItems);
        await this.database.tasks.bulkAdd(snapshot.tasks);
      },
    );
  }

  saveHousehold(household: Household) {
    return this.database.households.put(household).then(() => undefined);
  }

  saveMember(member: HouseholdMember) {
    return this.database.members.put(member).then(() => undefined);
  }

  async deleteMember(id: string) {
    await this.database.transaction(
      "rw",
      this.database.members,
      this.database.scheduleItems,
      this.database.tasks,
      async () => {
        await this.database.members.delete(id);
        const [events, tasks] = await Promise.all([
          this.database.scheduleItems.filter((item) => item.memberIds.includes(id)).toArray(),
          this.database.tasks.filter((task) => task.assigneeIds.includes(id)).toArray(),
        ]);
        await this.database.scheduleItems.bulkPut(
          events.map((item) => ({
            ...item,
            memberIds: item.memberIds.filter((value) => value !== id),
          })),
        );
        await this.database.tasks.bulkPut(
          tasks.map((task) => ({
            ...task,
            assigneeIds: task.assigneeIds.filter((value) => value !== id),
          })),
        );
      },
    );
  }

  saveScheduleItem(item: ScheduleItem) {
    return this.database.scheduleItems.put(item).then(() => undefined);
  }

  deleteScheduleItem(id: string) {
    return this.database.scheduleItems.delete(id);
  }

  saveTask(task: HouseholdTask) {
    return this.database.tasks.put(task).then(() => undefined);
  }

  deleteTask(id: string) {
    return this.database.tasks.delete(id);
  }

  async clear() {
    await this.database.delete();
    await this.database.open();
  }
}

export const repository = new DexieOpenWallRepository();
