import { z } from "zod";
import { MEMBER_COLORS, type HouseholdSnapshot, type OpenWallBackup } from "./types";

const householdSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  timezone: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const memberSchema = z.object({
  id: z.string().min(1),
  householdId: z.string().min(1),
  name: z.string().min(1),
  colorToken: z.enum(MEMBER_COLORS),
  symbol: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  role: z.enum(["parent", "child", "teen", "grandparent", "other"]).optional(),
  rewardApprovalRequired: z.boolean().optional(),
});

const eventSchema = z.object({
  id: z.string().min(1),
  householdId: z.string().min(1),
  title: z.string().min(1),
  memberIds: z.array(z.string()),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  allDay: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  kind: z.enum(["event", "reminder", "school-closure", "holiday", "early-dismissal", "personal-day"]).optional(),
  calendarDate: z.string().optional(),
  countdownLinkId: z.string().optional(),
  recurrence: z.object({
    frequency: z.enum(["daily", "weekly"]),
    interval: z.number().int().positive().optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).optional(),
    until: z.string().optional(),
  }).optional(),
});

const taskSchema = z.object({
  id: z.string().min(1),
  householdId: z.string().min(1),
  title: z.string().min(1),
  assigneeIds: z.array(z.string()),
  dueDate: z.string().optional(),
  completedAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  routineId: z.string().optional(),
  occurrenceDate: z.string().optional(),
  starValue: z.number().int().nonnegative().optional(),
});

const routineSchema = z.object({
  id: z.string().min(1), householdId: z.string().min(1), title: z.string().min(1),
  assigneeIds: z.array(z.string()), frequency: z.enum(["daily", "weekly", "school-days"]),
  weekdays: z.array(z.number().int().min(0).max(6)).optional(), skippedDates: z.array(z.string()).optional(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
});
const historySchema = z.object({
  id: z.string().min(1), householdId: z.string().min(1), entityId: z.string().min(1),
  entityType: z.enum(["schedule", "task", "routine", "reward", "photo"]),
  action: z.enum(["completed", "skipped", "missed", "edited", "deleted", "restored"]),
  occurredAt: z.iso.datetime(), memberIds: z.array(z.string()), summary: z.string(),
});
const rewardSchema = z.object({
  id: z.string().min(1), householdId: z.string().min(1), memberId: z.string().min(1),
  points: z.number().int(), reason: z.string().min(1), sourceTaskId: z.string().optional(), sourceType: z.enum(["task", "routine", "manual", "redemption", "challenge"]).optional(), sourceId: z.string().optional(), status: z.enum(["pending", "approved", "denied", "reversed"]).optional(), approvedBy: z.string().optional(), approvedAt: z.iso.datetime().optional(), reversalOfId: z.string().optional(), createdAt: z.iso.datetime(),
});
const rewardDefinitionSchema = z.object({ id: z.string().min(1), householdId: z.string().min(1), title: z.string().min(1), description: z.string().optional(), cost: z.number().int().nonnegative(), icon: z.string().min(1), active: z.boolean(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
const rewardGoalSchema = z.object({ id: z.string().min(1), householdId: z.string().min(1), title: z.string().min(1), targetStars: z.number().int().positive(), deadline: z.string().optional(), active: z.boolean(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
const rewardChallengeSchema = z.object({ id: z.string().min(1), householdId: z.string().min(1), title: z.string().min(1), description: z.string().optional(), bonusStars: z.number().int().nonnegative(), memberIds: z.array(z.string()), dueAt: z.iso.datetime(), completedMemberIds: z.array(z.string()).optional(), active: z.boolean(), createdAt: z.iso.datetime() });
const rewardRedemptionSchema = z.object({ id: z.string().min(1), householdId: z.string().min(1), rewardId: z.string().min(1), memberId: z.string().min(1), cost: z.number().int().nonnegative(), status: z.enum(["requested", "approved", "denied", "fulfilled"]), requestedAt: z.iso.datetime(), decidedAt: z.iso.datetime().optional(), decidedBy: z.string().optional() });
const activitySchema = z.object({ id: z.string().min(1), householdId: z.string().min(1), type: z.enum(["completion", "award", "redemption", "goal", "challenge", "reaction"]), entityId: z.string().min(1), memberIds: z.array(z.string()), summary: z.string(), createdAt: z.iso.datetime() });
const reactionSchema = z.object({ id: z.string().min(1), householdId: z.string().min(1), activityId: z.string().min(1), memberId: z.string().min(1), type: z.enum(["heart", "clap", "celebrate", "laugh", "star"]), createdAt: z.iso.datetime() });
const photoSchema = z.object({
  id: z.string().min(1), householdId: z.string().min(1), name: z.string().min(1),
  mimeType: z.string().min(1), dataUrl: z.string().min(1), createdAt: z.iso.datetime(),
});

export const backupSchema = z
  .object({
    format: z.literal("openwall-backup"),
  schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    exportedAt: z.iso.datetime(),
    household: householdSchema,
    members: z.array(memberSchema),
    scheduleItems: z.array(eventSchema),
    tasks: z.array(taskSchema),
    routines: z.array(routineSchema).optional(),
    history: z.array(historySchema).optional(),
    rewards: z.array(rewardSchema).optional(),
    rewardDefinitions: z.array(rewardDefinitionSchema).optional(),
    rewardGoals: z.array(rewardGoalSchema).optional(),
    rewardChallenges: z.array(rewardChallengeSchema).optional(),
    rewardRedemptions: z.array(rewardRedemptionSchema).optional(),
    activities: z.array(activitySchema).optional(),
    reactions: z.array(reactionSchema).optional(),
    photos: z.array(photoSchema).optional(),
    boardWidgets: z.array(z.object({
      id: z.string().min(1),
      type: z.enum(["welcome", "schedule", "tasks", "note", "countdown", "meal", "photo"]),
      x: z.number(), y: z.number(), w: z.number(), h: z.number(), tilt: z.number(),
      text: z.string().optional(), locked: z.boolean().optional(), stackedHeight: z.number().optional(),
      countdown: z.object({ title: z.string(), targetAt: z.string(), displayMode: z.enum(["auto", "days", "digital"]), completionMessage: z.string().optional(), timezone: z.string().optional() }).optional(),
    })).optional(),
  })
  .superRefine((data, context) => {
    const householdId = data.household.id;
    const invalid = [
      ...data.members,
      ...data.scheduleItems,
      ...data.tasks,
      ...(data.routines ?? []),
      ...(data.history ?? []),
      ...(data.rewards ?? []),
      ...(data.rewardDefinitions ?? []), ...(data.rewardGoals ?? []), ...(data.rewardChallenges ?? []), ...(data.rewardRedemptions ?? []), ...(data.activities ?? []), ...(data.reactions ?? []),
      ...(data.photos ?? []),
    ].some(
      (item) => item.householdId !== householdId,
    );
    if (invalid) context.addIssue({ code: "custom", message: "Backup contains mixed households." });
  });

export function serializeBackup(snapshot: HouseholdSnapshot, boardWidgets?: HouseholdSnapshot["boardWidgets"]): string {
  const backup: OpenWallBackup = {
    format: "openwall-backup",
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    ...snapshot,
    ...(boardWidgets ? { boardWidgets } : {}),
  };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(raw: string): HouseholdSnapshot {
  const parsed = backupSchema.parse(JSON.parse(raw));
  return {
    household: parsed.household,
    members: parsed.members,
    scheduleItems: parsed.scheduleItems,
    tasks: parsed.tasks,
    ...(parsed.routines ? { routines: parsed.routines } : {}),
    ...(parsed.history ? { history: parsed.history } : {}),
    ...(parsed.rewards ? { rewards: parsed.rewards } : {}),
    ...(parsed.rewardDefinitions ? { rewardDefinitions: parsed.rewardDefinitions } : {}),
    ...(parsed.rewardGoals ? { rewardGoals: parsed.rewardGoals } : {}),
    ...(parsed.rewardChallenges ? { rewardChallenges: parsed.rewardChallenges } : {}),
    ...(parsed.rewardRedemptions ? { rewardRedemptions: parsed.rewardRedemptions } : {}),
    ...(parsed.activities ? { activities: parsed.activities } : {}),
    ...(parsed.reactions ? { reactions: parsed.reactions } : {}),
    ...(parsed.photos ? { photos: parsed.photos } : {}),
    ...(parsed.boardWidgets ? { boardWidgets: parsed.boardWidgets } : {}),
  };
}
