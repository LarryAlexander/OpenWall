export const MEMBER_COLORS = ["sage", "coral", "gold", "sky", "plum", "clay"] as const;

export type MemberColorToken = (typeof MEMBER_COLORS)[number];

export interface Household {
  id: string;
  name: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  name: string;
  colorToken: MemberColorToken;
  symbol: string;
  sortOrder: number;
}

export interface ScheduleItem {
  id: string;
  householdId: string;
  title: string;
  memberIds: string[];
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdTask {
  id: string;
  householdId: string;
  title: string;
  assigneeIds: string[];
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpenWallBackup {
  format: "openwall-backup";
  schemaVersion: 1;
  exportedAt: string;
  household: Household;
  members: HouseholdMember[];
  scheduleItems: ScheduleItem[];
  tasks: HouseholdTask[];
}

export interface HouseholdSnapshot {
  household: Household;
  members: HouseholdMember[];
  scheduleItems: ScheduleItem[];
  tasks: HouseholdTask[];
}

export type EditorTarget =
  { kind: "event"; value?: ScheduleItem } | { kind: "task"; value?: HouseholdTask };
