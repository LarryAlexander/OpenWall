import Dexie, { type EntityTable } from "dexie";
import type {
  Household,
  HouseholdMember,
  HouseholdSnapshot,
  HouseholdTask,
  ScheduleItem,
  HistoryEntry,
  PhotoAsset,
  RewardLedgerEntry,
  RewardDefinition,
  RewardGoal,
  RewardChallenge,
  RewardRedemption,
  ActivityEntry,
  FamilyReaction,
  Routine,
  BoardLayout,
} from "./types";

class OpenWallDatabase extends Dexie {
  households!: EntityTable<Household, "id">;
  members!: EntityTable<HouseholdMember, "id">;
  scheduleItems!: EntityTable<ScheduleItem, "id">;
  tasks!: EntityTable<HouseholdTask, "id">;
  routines!: EntityTable<Routine, "id">;
  history!: EntityTable<HistoryEntry, "id">;
  rewards!: EntityTable<RewardLedgerEntry, "id">;
  rewardDefinitions!: EntityTable<RewardDefinition, "id">;
  rewardGoals!: EntityTable<RewardGoal, "id">;
  rewardChallenges!: EntityTable<RewardChallenge, "id">;
  rewardRedemptions!: EntityTable<RewardRedemption, "id">;
  activities!: EntityTable<ActivityEntry, "id">;
  reactions!: EntityTable<FamilyReaction, "id">;
  photos!: EntityTable<PhotoAsset, "id">;
  boardLayouts!: EntityTable<BoardLayout, "id">;

  constructor(name = "openwall") {
    super(name);
    this.version(1).stores({
      households: "id, updatedAt",
      members: "id, householdId, sortOrder",
      scheduleItems: "id, householdId, startsAt, *memberIds",
      tasks: "id, householdId, dueDate, completedAt, *assigneeIds",
    });
    this.version(2).stores({
      households: "id, updatedAt",
      members: "id, householdId, sortOrder",
      scheduleItems: "id, householdId, startsAt, calendarDate, *memberIds",
      tasks: "id, householdId, dueDate, completedAt, routineId, *assigneeIds",
      routines: "id, householdId, frequency",
      history: "id, householdId, occurredAt, entityType",
      rewards: "id, householdId, memberId, createdAt",
      photos: "id, householdId, createdAt",
      boardLayouts: "id, householdId, updatedAt",
    });
    this.version(3).stores({
      households: "id, updatedAt",
      members: "id, householdId, sortOrder",
      scheduleItems: "id, householdId, startsAt, calendarDate, *memberIds",
      tasks: "id, householdId, dueDate, completedAt, routineId, *assigneeIds",
      routines: "id, householdId, frequency",
      history: "id, householdId, occurredAt, entityType",
      rewards: "id, householdId, memberId, createdAt, status, sourceId",
      rewardDefinitions: "id, householdId, active, updatedAt",
      rewardGoals: "id, householdId, active, updatedAt",
      rewardChallenges: "id, householdId, active, dueAt",
      rewardRedemptions: "id, householdId, memberId, status, requestedAt",
      activities: "id, householdId, createdAt, type",
      reactions: "id, householdId, activityId, memberId",
      photos: "id, householdId, createdAt",
      boardLayouts: "id, householdId, updatedAt",
    });
  }
}

export const db = new OpenWallDatabase();

function optionalTable<T extends { id: string }>(database: OpenWallDatabase, name: string) {
  return (database as unknown as Record<string, EntityTable<T, "id"> | undefined>)[name];
}

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
  saveHistory(entry: HistoryEntry): Promise<void>;
  saveRoutine(routine: Routine): Promise<void>;
  saveReward(entry: RewardLedgerEntry): Promise<void>;
  saveRewardDefinition(definition: RewardDefinition): Promise<void>;
  saveRewardGoal(goal: RewardGoal): Promise<void>;
  saveRewardChallenge(challenge: RewardChallenge): Promise<void>;
  saveRewardRedemption(redemption: RewardRedemption): Promise<void>;
  saveActivity(entry: ActivityEntry): Promise<void>;
  saveReaction(reaction: FamilyReaction): Promise<void>;
  savePhoto(photo: PhotoAsset): Promise<void>;
  deletePhoto(id: string): Promise<void>;
  saveBoardLayout(layout: BoardLayout): Promise<void>;
  clear(): Promise<void>;
}

export class DexieOpenWallRepository implements OpenWallRepository {
  constructor(private readonly database: OpenWallDatabase = db) {}

  async load(): Promise<HouseholdSnapshot | null> {
    const household = await this.database.households.orderBy("updatedAt").last();
    if (!household) return null;

    const rewardDefinitions = optionalTable<RewardDefinition>(this.database, "rewardDefinitions");
    const rewardGoals = optionalTable<RewardGoal>(this.database, "rewardGoals");
    const rewardChallenges = optionalTable<RewardChallenge>(this.database, "rewardChallenges");
    const rewardRedemptions = optionalTable<RewardRedemption>(this.database, "rewardRedemptions");
    const activities = optionalTable<ActivityEntry>(this.database, "activities");
    const reactions = optionalTable<FamilyReaction>(this.database, "reactions");
    const [members, scheduleItems, tasks, routines, history, rewards, definitions, goals, challenges, redemptions, activityEntries, reactionEntries, photos, boardLayout] = await Promise.all([
      this.database.members.where("householdId").equals(household.id).sortBy("sortOrder"),
      this.database.scheduleItems.where("householdId").equals(household.id).sortBy("startsAt"),
      this.database.tasks.where("householdId").equals(household.id).toArray(),
      this.database.routines.where("householdId").equals(household.id).toArray(),
      this.database.history.where("householdId").equals(household.id).sortBy("occurredAt"),
      this.database.rewards.where("householdId").equals(household.id).sortBy("createdAt"),
      rewardDefinitions ? rewardDefinitions.where("householdId").equals(household.id).sortBy("updatedAt") : Promise.resolve([]),
      rewardGoals ? rewardGoals.where("householdId").equals(household.id).sortBy("updatedAt") : Promise.resolve([]),
      rewardChallenges ? rewardChallenges.where("householdId").equals(household.id).sortBy("dueAt") : Promise.resolve([]),
      rewardRedemptions ? rewardRedemptions.where("householdId").equals(household.id).sortBy("requestedAt") : Promise.resolve([]),
      activities ? activities.where("householdId").equals(household.id).sortBy("createdAt") : Promise.resolve([]),
      reactions ? reactions.where("householdId").equals(household.id).toArray() : Promise.resolve([]),
      this.database.photos.where("householdId").equals(household.id).sortBy("createdAt"),
      this.database.boardLayouts.where("householdId").equals(household.id).first(),
    ]);

    return { household, members, scheduleItems, tasks, routines, history, rewards, rewardDefinitions: definitions, rewardGoals: goals, rewardChallenges: challenges, rewardRedemptions: redemptions, activities: activityEntries, reactions: reactionEntries, photos, boardWidgets: boardLayout?.widgets };
  }

  async replace(snapshot: HouseholdSnapshot): Promise<void> {
    const rewardDefinitions = optionalTable<RewardDefinition>(this.database, "rewardDefinitions");
    const rewardGoals = optionalTable<RewardGoal>(this.database, "rewardGoals");
    const rewardChallenges = optionalTable<RewardChallenge>(this.database, "rewardChallenges");
    const rewardRedemptions = optionalTable<RewardRedemption>(this.database, "rewardRedemptions");
    const activities = optionalTable<ActivityEntry>(this.database, "activities");
    const reactions = optionalTable<FamilyReaction>(this.database, "reactions");
    const transactionTables = ["households", "members", "scheduleItems", "tasks", "routines", "history", "rewards", "rewardDefinitions", "rewardGoals", "rewardChallenges", "rewardRedemptions", "activities", "reactions", "photos", "boardLayouts"]
      .filter((name) => this.database.tables.some((table) => table.name === name));
    await this.database.transaction(
      "rw",
      transactionTables,
      async () => {
        await Promise.all([
          this.database.households.clear(),
          this.database.members.clear(),
          this.database.scheduleItems.clear(),
          this.database.tasks.clear(),
          this.database.routines.clear(),
          this.database.history.clear(),
          this.database.rewards.clear(),
          ...(rewardDefinitions ? [rewardDefinitions.clear()] : []),
          ...(rewardGoals ? [rewardGoals.clear()] : []),
          ...(rewardChallenges ? [rewardChallenges.clear()] : []),
          ...(rewardRedemptions ? [rewardRedemptions.clear()] : []),
          ...(activities ? [activities.clear()] : []),
          ...(reactions ? [reactions.clear()] : []),
          this.database.photos.clear(),
          this.database.boardLayouts.clear(),
        ]);
        await this.database.households.add(snapshot.household);
        await this.database.members.bulkAdd(snapshot.members);
        await this.database.scheduleItems.bulkAdd(snapshot.scheduleItems);
        await this.database.tasks.bulkAdd(snapshot.tasks);
        if (snapshot.routines?.length) await this.database.routines.bulkAdd(snapshot.routines);
        if (snapshot.history?.length) await this.database.history.bulkAdd(snapshot.history);
        if (snapshot.rewards?.length) await this.database.rewards.bulkAdd(snapshot.rewards);
        if (rewardDefinitions && snapshot.rewardDefinitions?.length) await rewardDefinitions.bulkAdd(snapshot.rewardDefinitions);
        if (rewardGoals && snapshot.rewardGoals?.length) await rewardGoals.bulkAdd(snapshot.rewardGoals);
        if (rewardChallenges && snapshot.rewardChallenges?.length) await rewardChallenges.bulkAdd(snapshot.rewardChallenges);
        if (rewardRedemptions && snapshot.rewardRedemptions?.length) await rewardRedemptions.bulkAdd(snapshot.rewardRedemptions);
        if (activities && snapshot.activities?.length) await activities.bulkAdd(snapshot.activities);
        if (reactions && snapshot.reactions?.length) await reactions.bulkAdd(snapshot.reactions);
        if (snapshot.photos?.length) await this.database.photos.bulkAdd(snapshot.photos);
        if (snapshot.boardWidgets) await this.database.boardLayouts.put({ id: snapshot.household.id, householdId: snapshot.household.id, widgets: snapshot.boardWidgets, updatedAt: snapshot.household.updatedAt });
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
      this.database.routines,
      async () => {
        await this.database.members.delete(id);
        const [events, tasks, routines] = await Promise.all([
          this.database.scheduleItems.filter((item) => item.memberIds.includes(id)).toArray(),
          this.database.tasks.filter((task) => task.assigneeIds.includes(id)).toArray(),
          this.database.routines.filter((routine) => routine.assigneeIds.includes(id)).toArray(),
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
        await this.database.routines.bulkPut(
          routines.map((routine) => ({
            ...routine,
            assigneeIds: routine.assigneeIds.filter((value) => value !== id),
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

  saveHistory(entry: HistoryEntry) {
    return this.database.history.put(entry).then(() => undefined);
  }

  saveRoutine(routine: Routine) {
    return this.database.routines.put(routine).then(() => undefined);
  }

  saveReward(entry: RewardLedgerEntry) {
    return this.database.rewards.put(entry).then(() => undefined);
  }

  saveRewardDefinition(definition: RewardDefinition) { return this.database.rewardDefinitions.put(definition).then(() => undefined); }
  saveRewardGoal(goal: RewardGoal) { return this.database.rewardGoals.put(goal).then(() => undefined); }
  saveRewardChallenge(challenge: RewardChallenge) { return this.database.rewardChallenges.put(challenge).then(() => undefined); }
  saveRewardRedemption(redemption: RewardRedemption) { return this.database.rewardRedemptions.put(redemption).then(() => undefined); }
  saveActivity(entry: ActivityEntry) { return this.database.activities.put(entry).then(() => undefined); }
  saveReaction(reaction: FamilyReaction) { return this.database.reactions.put(reaction).then(() => undefined); }

  savePhoto(photo: PhotoAsset) {
    return this.database.photos.put(photo).then(() => undefined);
  }

  deletePhoto(id: string) {
    return this.database.photos.delete(id);
  }

  saveBoardLayout(layout: BoardLayout) {
    return this.database.boardLayouts.put(layout).then(() => undefined);
  }

  async clear() {
    await this.database.delete();
    await this.database.open();
  }
}

export const repository = new DexieOpenWallRepository();
