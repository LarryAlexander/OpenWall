import type {
  AttentionItem,
  AttentionState,
  HouseholdMember,
  HouseholdSnapshot,
} from "./types";

const dayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Derive the household's actionable inbox from persisted records. Items are
 * intentionally ephemeral: acknowledgements and snoozes live in
 * AttentionState so the source record remains the source of truth.
 */
export function deriveAttentionItems(
  snapshot: HouseholdSnapshot,
  now = new Date(),
  systemItems: AttentionItem[] = [],
): AttentionItem[] {
  const today = dayKey(now);
  const items: AttentionItem[] = [];

  for (const task of snapshot.tasks) {
    if (task.completedAt) continue;
    if (!task.dueDate) continue;
    if (task.dueDate < today) {
      items.push({
        id: `task-overdue-${task.id}`,
        householdId: task.householdId,
        sourceType: "task",
        sourceId: task.id,
        memberIds: task.assigneeIds,
        title: task.title,
        summary: `Overdue since ${task.dueDate}`,
        reason: "overdue",
        priority: 10,
        dueAt: task.dueDate,
      });
    } else if (task.dueDate === today) {
      items.push({
        id: `task-today-${task.id}`,
        householdId: task.householdId,
        sourceType: "task",
        sourceId: task.id,
        memberIds: task.assigneeIds,
        title: task.title,
        summary: "Due today",
        reason: "due-today",
        priority: 30,
        dueAt: task.dueDate,
      });
    }
  }

  // Reminders are the one schedule kind that can become actionable. Ordinary
  // future events stay in Upcoming and the calendar so the inbox remains calm.
  for (const item of snapshot.scheduleItems) {
    if (item.kind !== "reminder") continue;
    const date = item.calendarDate ?? dayKey(new Date(item.startsAt));
    if (date > today) continue;
    const overdue = date < today || new Date(item.endsAt).getTime() < now.getTime();
    items.push({
      id: `schedule-${overdue ? "overdue" : "today"}-${item.id}`,
      householdId: item.householdId,
      sourceType: "schedule",
      sourceId: item.id,
      memberIds: item.memberIds,
      title: item.title,
      summary: overdue ? `Reminder from ${date}` : "Reminder for today",
      reason: overdue ? "overdue" : "due-today",
      priority: overdue ? 12 : 25,
      dueAt: item.startsAt,
    });
  }

  for (const routine of snapshot.routines ?? []) {
    const occurrences = (snapshot.routineOccurrences ?? [])
      .filter((candidate) => candidate.routineId === routine.id)
      .filter((candidate) => candidate.status === "missed" || (candidate.status === "pending" && candidate.occurrenceDate < today));
    for (const occurrence of occurrences) {
      items.push({
        id: `routine-missed-${routine.id}-${occurrence.occurrenceDate}`,
        householdId: routine.householdId,
        sourceType: "routine",
        sourceId: routine.id,
        occurrenceKey: occurrence.occurrenceDate,
        memberIds: routine.assigneeIds,
        title: routine.title,
        summary: occurrence.status === "missed" ? "Routine was missed" : `Routine was not completed on ${occurrence.occurrenceDate}`,
        reason: "missed",
        priority: 15,
        dueAt: occurrence.occurrenceDate,
      });
    }
  }

  for (const reward of snapshot.rewards ?? []) {
    if (reward.status !== "pending") continue;
    items.push({
      id: `reward-approval-${reward.id}`,
      householdId: reward.householdId,
      sourceType: "reward",
      sourceId: reward.id,
      memberIds: [reward.memberId],
      title: "Star approval needed",
      summary: reward.reason,
      reason: "approval-needed",
      priority: 20,
      dueAt: reward.createdAt,
    });
  }

  for (const redemption of snapshot.rewardRedemptions ?? []) {
    if (redemption.status !== "requested") continue;
    const member = snapshot.members.find((candidate) => candidate.id === redemption.memberId);
    const definition = snapshot.rewardDefinitions?.find((candidate) => candidate.id === redemption.rewardId);
    items.push({
      id: `redemption-approval-${redemption.id}`,
      householdId: redemption.householdId,
      sourceType: "reward",
      sourceId: redemption.id,
      memberIds: [redemption.memberId],
      title: "Reward request needs a parent",
      summary: `${member?.name ?? "A household member"} requested ${definition?.title ?? "a reward"} for ${redemption.cost} Stars`,
      reason: "approval-needed",
      priority: 22,
      dueAt: redemption.requestedAt,
    });
  }

  return [...items, ...systemItems].sort(
    (left, right) => right.priority - left.priority || left.title.localeCompare(right.title),
  );
}

export function visibleAttentionItems(
  items: AttentionItem[],
  states: AttentionState[] = [],
  now = new Date(),
) {
  const timestamp = now.getTime();
  const stateByItem = new Map(states.map((state) => [attentionStateKey(state), state]));
  return items.filter((item) => {
    const state = stateByItem.get(attentionItemKey(item));
    if (!state) return true;
    if (state.snoozedUntil && new Date(state.snoozedUntil).getTime() > timestamp) return false;
    return !state.acknowledgedAt;
  });
}

export function attentionItemKey(item: Pick<AttentionItem, "sourceType" | "sourceId" | "occurrenceKey">) {
  return `${item.sourceType}:${item.sourceId}:${item.occurrenceKey ?? ""}`;
}

export function attentionStateKey(state: Pick<AttentionState, "sourceType" | "sourceId" | "occurrenceKey">) {
  return `${state.sourceType}:${state.sourceId}:${state.occurrenceKey ?? ""}`;
}

export function memberAttentionCount(
  member: HouseholdMember,
  items: AttentionItem[],
): number {
  if (member.role === "parent" || member.role === "admin") return items.length;
  return items.filter((item) => item.memberIds.length === 0 || item.memberIds.includes(member.id)).length;
}

export function attentionStateFor(
  item: AttentionItem,
  states: AttentionState[],
): AttentionState | undefined {
  return states.find((state) => attentionStateKey(state) === attentionItemKey(item));
}
