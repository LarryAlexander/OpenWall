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
});

export const backupSchema = z
  .object({
    format: z.literal("openwall-backup"),
    schemaVersion: z.literal(1),
    exportedAt: z.iso.datetime(),
    household: householdSchema,
    members: z.array(memberSchema),
    scheduleItems: z.array(eventSchema),
    tasks: z.array(taskSchema),
  })
  .superRefine((data, context) => {
    const householdId = data.household.id;
    const invalid = [...data.members, ...data.scheduleItems, ...data.tasks].some(
      (item) => item.householdId !== householdId,
    );
    if (invalid) context.addIssue({ code: "custom", message: "Backup contains mixed households." });
  });

export function serializeBackup(snapshot: HouseholdSnapshot): string {
  const backup: OpenWallBackup = {
    format: "openwall-backup",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    ...snapshot,
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
  };
}
