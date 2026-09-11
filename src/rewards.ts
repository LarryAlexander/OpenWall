import type { HouseholdMember, HouseholdTask, RewardLedgerEntry } from "./types";

export const DEFAULT_STAR_VALUE = 5;

export function taskStarValue(task: HouseholdTask) {
  return Math.max(0, task.starValue ?? DEFAULT_STAR_VALUE);
}

export function requiresRewardApproval(member: HouseholdMember) {
  return member.rewardApprovalRequired ?? member.role === "child";
}

export function rewardBalance(memberId: string, tasks: HouseholdTask[], ledger: RewardLedgerEntry[]) {
  const taskAwarded = new Set(
    ledger
      .filter((entry) => entry.memberId === memberId && entry.sourceTaskId && entry.status !== "denied")
      .map((entry) => entry.sourceTaskId),
  );
  const completed = tasks
    .filter((task) => task.completedAt && task.assigneeIds.includes(memberId) && !taskAwarded.has(task.id))
    .reduce((total, task) => total + taskStarValue(task), 0);
  const adjustments = ledger
    .filter((entry) => entry.memberId === memberId && entry.status !== "denied" && entry.status !== "pending")
    .reduce((total, entry) => total + entry.points, 0);
  return Math.max(0, completed + adjustments);
}

export function hasAwardForTask(taskId: string, memberId: string, ledger: RewardLedgerEntry[]) {
  return ledger.some((entry) => entry.sourceTaskId === taskId && entry.memberId === memberId && entry.status !== "denied");
}

export function currentStreak(memberId: string, tasks: HouseholdTask[], now = new Date()) {
  const completedDates = new Set(
    tasks
      .filter((task) => task.completedAt && task.assigneeIds.includes(memberId))
      .map((task) => task.completedAt!.slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function levelForStars(stars: number) {
  return Math.max(1, Math.floor(Math.max(0, stars) / 100) + 1);
}
