import type { ScheduleItem } from "./types";

const DAY_MS = 86_400_000;

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateKeysFrom(start: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return dateKey(date);
  });
}

function dateAtNoon(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function daysBetween(start: string, end: string): number {
  return Math.round((dateAtNoon(end).getTime() - dateAtNoon(start).getTime()) / DAY_MS);
}

/** Return whether a schedule item should appear on a local calendar date. */
export function scheduleOccursOnDate(item: ScheduleItem, date: string): boolean {
  const firstDate = item.calendarDate ?? dateKey(new Date(item.startsAt));
  if (date < firstDate || (item.recurrence?.until && date > item.recurrence.until)) return false;
  if (!item.recurrence) return date === firstDate;

  const interval = Math.max(1, item.recurrence.interval ?? 1);
  const elapsedDays = daysBetween(firstDate, date);
  if (item.recurrence.frequency === "daily") return elapsedDays % interval === 0;

  const first = dateAtNoon(firstDate);
  const current = dateAtNoon(date);
  const firstWeekStart = new Date(first);
  firstWeekStart.setDate(first.getDate() - first.getDay());
  const currentWeekStart = new Date(current);
  currentWeekStart.setDate(current.getDate() - current.getDay());
  const elapsedWeeks = Math.round((currentWeekStart.getTime() - firstWeekStart.getTime()) / (7 * DAY_MS));
  if (elapsedWeeks % interval !== 0) return false;

  const weekdays = item.recurrence.weekdays?.length ? item.recurrence.weekdays : [first.getDay()];
  return weekdays.includes(current.getDay());
}
