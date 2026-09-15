export type DisplayMode = "normal" | "focus" | "sleep";

export interface DisplaySchedulePreferences {
  schemaVersion: 1;
  enabled: boolean;
  focusStart: string;
  focusEnd: string;
  sleepStart: string;
  sleepEnd: string;
}

export const DEFAULT_DISPLAY_SCHEDULE: DisplaySchedulePreferences = {
  schemaVersion: 1,
  enabled: false,
  focusStart: "08:00",
  focusEnd: "18:00",
  sleepStart: "22:00",
  sleepEnd: "06:30",
};

const STORAGE_KEY = "openwall-display-schedule-v1";

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : 0;
};

const isInRange = (current: number, start: number, end: number) => {
  if (start === end) return false;
  return start < end ? current >= start && current < end : current >= start || current < end;
};

export function loadDisplaySchedule(): DisplaySchedulePreferences {
  if (typeof window === "undefined") return DEFAULT_DISPLAY_SCHEDULE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DISPLAY_SCHEDULE;
    const parsed = JSON.parse(stored) as Partial<DisplaySchedulePreferences>;
    return {
      ...DEFAULT_DISPLAY_SCHEDULE,
      ...parsed,
      enabled: parsed.enabled === true,
      schemaVersion: 1,
    };
  } catch {
    return DEFAULT_DISPLAY_SCHEDULE;
  }
}

export function saveDisplaySchedule(preferences: DisplaySchedulePreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Local display preferences are best-effort and never block household data.
  }
}

export function displayModeAt(date: Date, preferences: DisplaySchedulePreferences): DisplayMode {
  if (!preferences.enabled) return "normal";
  const current = date.getHours() * 60 + date.getMinutes();
  if (isInRange(current, minutesFromTime(preferences.sleepStart), minutesFromTime(preferences.sleepEnd))) return "sleep";
  if (isInRange(current, minutesFromTime(preferences.focusStart), minutesFromTime(preferences.focusEnd))) return "focus";
  return "normal";
}

export function formatNextDisplayWindow(date: Date, preferences: DisplaySchedulePreferences, mode: DisplayMode) {
  const time = mode === "sleep" ? preferences.sleepEnd : preferences.focusEnd;
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  if (next <= date) next.setDate(next.getDate() + 1);
  return next;
}
