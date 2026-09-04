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

export type CountdownDisplayMode = "auto" | "days" | "digital";

export interface CountdownWidgetConfig {
  title: string;
  targetAt: string;
  displayMode: CountdownDisplayMode;
  completionMessage?: string;
  timezone?: string;
}

export type BoardWidgetType =
  "welcome" | "schedule" | "tasks" | "note" | "countdown" | "meal" | "photo";

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
  countdown?: CountdownWidgetConfig;
}

export type EditorTarget =
  { kind: "event"; value?: ScheduleItem } | { kind: "task"; value?: HouseholdTask };

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
