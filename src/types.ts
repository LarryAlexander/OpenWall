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
  role?: "parent" | "child" | "teen" | "grandparent" | "other";
  rewardApprovalRequired?: boolean;
}

export type ScheduleKind =
  | "event"
  | "reminder"
  | "school-closure"
  | "holiday"
  | "early-dismissal"
  | "personal-day";

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
  kind?: ScheduleKind;
  calendarDate?: string;
  recurrence?: RecurrenceRule;
  countdownLinkId?: string;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly";
  interval?: number;
  weekdays?: number[];
  until?: string;
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
  routineId?: string;
  occurrenceDate?: string;
  starValue?: number;
}

export interface Routine {
  id: string;
  householdId: string;
  title: string;
  assigneeIds: string[];
  frequency: "daily" | "weekly" | "school-days";
  weekdays?: number[];
  skippedDates?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  householdId: string;
  entityId: string;
  entityType: "schedule" | "task" | "routine" | "reward" | "photo";
  action: "completed" | "skipped" | "missed" | "edited" | "deleted" | "restored";
  occurredAt: string;
  memberIds: string[];
  summary: string;
}

export interface RewardLedgerEntry {
  id: string;
  householdId: string;
  memberId: string;
  points: number;
  reason: string;
  sourceTaskId?: string;
  sourceType?: "task" | "routine" | "manual" | "redemption" | "challenge";
  sourceId?: string;
  status?: "pending" | "approved" | "denied" | "reversed";
  approvedBy?: string;
  approvedAt?: string;
  reversalOfId?: string;
  createdAt: string;
}

export interface RewardDefinition {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  cost: number;
  icon: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardGoal {
  id: string;
  householdId: string;
  title: string;
  targetStars: number;
  deadline?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardChallenge {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  bonusStars: number;
  memberIds: string[];
  dueAt: string;
  completedMemberIds?: string[];
  active: boolean;
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  householdId: string;
  rewardId: string;
  memberId: string;
  cost: number;
  status: "requested" | "approved" | "denied" | "fulfilled";
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export type FamilyReactionType = "heart" | "clap" | "celebrate" | "laugh" | "star";

export interface FamilyReaction {
  id: string;
  householdId: string;
  activityId: string;
  memberId: string;
  type: FamilyReactionType;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  householdId: string;
  type: "completion" | "award" | "redemption" | "goal" | "challenge" | "reaction";
  entityId: string;
  memberIds: string[];
  summary: string;
  createdAt: string;
}

export interface PhotoAsset {
  id: string;
  householdId: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}

export interface OpenWallBackup {
  format: "openwall-backup";
  schemaVersion: 3;
  exportedAt: string;
  household: Household;
  members: HouseholdMember[];
  scheduleItems: ScheduleItem[];
  tasks: HouseholdTask[];
  routines?: Routine[];
  history?: HistoryEntry[];
  rewards?: RewardLedgerEntry[];
  rewardDefinitions?: RewardDefinition[];
  rewardGoals?: RewardGoal[];
  rewardChallenges?: RewardChallenge[];
  rewardRedemptions?: RewardRedemption[];
  activities?: ActivityEntry[];
  reactions?: FamilyReaction[];
  photos?: PhotoAsset[];
  boardWidgets?: BoardWidget[];
}

export interface HouseholdSnapshot {
  household: Household;
  members: HouseholdMember[];
  scheduleItems: ScheduleItem[];
  tasks: HouseholdTask[];
  routines?: Routine[];
  history?: HistoryEntry[];
  rewards?: RewardLedgerEntry[];
  rewardDefinitions?: RewardDefinition[];
  rewardGoals?: RewardGoal[];
  rewardChallenges?: RewardChallenge[];
  rewardRedemptions?: RewardRedemption[];
  activities?: ActivityEntry[];
  reactions?: FamilyReaction[];
  photos?: PhotoAsset[];
  boardWidgets?: BoardWidget[];
}

export type CountdownDisplayMode = "auto" | "days" | "digital";

export interface CountdownWidgetConfig {
  title: string;
  targetAt: string;
  displayMode: CountdownDisplayMode;
  completionMessage?: string;
  timezone?: string;
}

export type BoardWidgetType =
  "welcome" | "schedule" | "tasks" | "note" | "countdown" | "meal" | "photo" | "clock" | "calendar";

export interface BoardWidget {
  id: string;
  type: BoardWidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  tilt: number;
  text?: string;
  locked?: boolean;
  stackedHeight?: number;
  countdown?: CountdownWidgetConfig;
}

export interface BoardLayout {
  id: string;
  householdId: string;
  widgets: BoardWidget[];
  updatedAt: string;
}

export type EditorTarget =
  { kind: "event"; value?: ScheduleItem; initialDate?: string } | { kind: "task"; value?: HouseholdTask };

export type TourStatus = "unseen" | "dismissed" | "completed";

export interface GuideState {
  schemaVersion: 1;
  tourStatus: TourStatus;
  completedTourVersion?: string;
  dismissedTipIds: string[];
  seenReleaseVersions: string[];
  lastHelpCategory?: string;
}

export type GuideCategoryId =
  | "getting-started"
  | "cards-and-countdowns"
  | "arranging-the-board"
  | "household-members-and-filters"
  | "offline-use-and-installation"
  | "backup-restore-and-privacy"
  | "troubleshooting";

export interface GuideCategory {
  id: GuideCategoryId;
  title: string;
  description: string;
}

export type GuideActionType = "tour" | "tour-step" | "navigate";

export interface GuideAction {
  type: GuideActionType;
  label: string;
  stepIndex?: number;
  targetView?: "today" | "settings";
}

export interface GuideArticle {
  id: string;
  title: string;
  summary: string;
  categoryId: GuideCategoryId;
  keywords: string[];
  steps: string[];
  action?: GuideAction;
}

export interface ReleaseNote {
  version: string;
  releasedAt: string;
  title: string;
  summary: string;
  highlights: string[];
  relatedArticleIds: string[];
}

export type ColorThemePreset =
  "warm-cork" | "sage-grove" | "terracotta" | "desert-sand" | "ocean-mist" | "wild-plum";

export type BoardBackground =
  "classic-cork" | "fine-cork" | "kraft-paper" | "soft-linen" | "minimal-canvas";

export type CardCornerStyle = "sharp" | "subtle" | "natural" | "rounded" | "pill";

export type TextScale = "compact" | "default" | "comfortable" | "large";

export type ColorMode = "system" | "light" | "dark";

export type MotionPreference = "full" | "gentle" | "off";

export interface AppearancePreferences {
  schemaVersion: 1;
  colorTheme: ColorThemePreset;
  boardBackground: BoardBackground;
  cornerStyle: CardCornerStyle;
  textScale: TextScale;
  colorMode: ColorMode;
  motion: MotionPreference;
}
