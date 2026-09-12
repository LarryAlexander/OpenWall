import type { HouseholdTask, Routine, RoutineOccurrence } from "./types";

/** Return the local calendar key used by routine generation. */
export function routineDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Determine whether a routine has an occurrence on a local calendar date. */
export function routineOccursOnDate(routine: Routine, date: string) {
  const exception = routine.exceptions?.find((candidate) => candidate.date === date);
  const movedFrom = routine.exceptions?.find(
    (candidate) => candidate.action === "reschedule" && candidate.rescheduledDate === date,
  );
  // A rescheduled occurrence belongs on its new date, while the original date
  // is suppressed. Evaluate the recurrence against the original date so a
  // weekly Monday routine moved to Wednesday remains a valid occurrence.
  const effectiveDate = movedFrom?.date ?? date;
  if (routine.skippedDates?.includes(effectiveDate)) return false;
  if (exception?.action === "skip") return false;
  if (exception?.action === "reschedule" && exception.rescheduledDate && exception.rescheduledDate !== date) return false;

  const weekday = new Date(`${effectiveDate}T12:00:00`).getDay();
  if (routine.frequency === "daily") return true;
  if (routine.frequency === "weekly") return routine.weekdays?.includes(weekday) ?? false;
  return weekday > 0 && weekday < 6;
}

export function routineOccurrenceId(routineId: string, date: string) {
  return `occurrence-${routineId}-${date}`;
}

export function makeRoutineOccurrence(
  routine: Routine,
  date: string,
  now = new Date(),
): { task: HouseholdTask; occurrence: RoutineOccurrence } {
  const timestamp = now.toISOString();
  return {
    task: {
      id: routineOccurrenceId(routine.id, date),
      householdId: routine.householdId,
      title: routine.title,
      assigneeIds: routine.assigneeIds,
      dueDate: date,
      routineId: routine.id,
      occurrenceDate: date,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    occurrence: {
      id: routineOccurrenceId(routine.id, date),
      householdId: routine.householdId,
      routineId: routine.id,
      occurrenceDate: date,
      status: "pending",
      assigneeIds: routine.assigneeIds,
      updatedAt: timestamp,
    },
  };
}
