import { formatDate } from "./date";
import type { HouseholdSnapshot, MemberColorToken, ScheduleItem } from "./types";

const makeId = () => crypto.randomUUID();

export function createHousehold(name: string, memberNames: string[]): HouseholdSnapshot {
  const now = new Date();
  const householdId = makeId();
  const palette: MemberColorToken[] = ["sage", "coral", "gold", "sky", "plum", "clay"];

  return {
    household: {
      id: householdId,
      name,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    members: memberNames.map((memberName, index) => ({
      id: makeId(),
      householdId,
      name: memberName,
      colorToken: palette[index % palette.length],
      symbol: memberName.trim().charAt(0).toUpperCase() || String(index + 1),
      sortOrder: index,
    })),
    scheduleItems: [],
    tasks: [],
  };
}

export function createSampleHousehold(): HouseholdSnapshot {
  const snapshot = createHousehold("The River House", ["Maya", "Theo", "Nana Jo", "Ari"]);
  const [maya, theo, jo, ari] = snapshot.members;
  const now = new Date();
  const at = (hours: number, minutes = 0) => {
    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };
  const inMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);
  const createdAt = now.toISOString();

  snapshot.scheduleItems = [
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "School drop-off",
      memberIds: [theo.id, ari.id],
      startsAt: at(8, 10).toISOString(),
      endsAt: at(8, 40).toISOString(),
      allDay: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Design review",
      memberIds: [maya.id],
      startsAt: at(10).toISOString(),
      endsAt: at(11).toISOString(),
      allDay: false,
      notes: "Bring the latest sketches",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Library club",
      memberIds: [jo.id],
      startsAt: at(13, 30).toISOString(),
      endsAt: at(14, 30).toISOString(),
      allDay: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Soccer practice",
      memberIds: [theo.id],
      startsAt: at(16, 30).toISOString(),
      endsAt: at(18).toISOString(),
      allDay: false,
      notes: "Blue field",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Taco night",
      memberIds: snapshot.members.map((member) => member.id),
      startsAt: at(18, 30).toISOString(),
      endsAt: inMinutes(at(18, 30), 60).toISOString(),
      allDay: false,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  snapshot.tasks = [
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Feed Pepper",
      assigneeIds: [ari.id],
      dueDate: formatDate(now, "yyyy-MM-dd"),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Bring recycling out",
      assigneeIds: [theo.id],
      dueDate: formatDate(now, "yyyy-MM-dd"),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Pick up groceries",
      assigneeIds: [maya.id, jo.id],
      dueDate: formatDate(now, "yyyy-MM-dd"),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Water the herbs",
      assigneeIds: [jo.id],
      dueDate: formatDate(now, "yyyy-MM-dd"),
      completedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  snapshot.rewardDefinitions = [
    { id: makeId(), householdId: snapshot.household.id, title: "Choose dinner", cost: 75, icon: "🍕", active: true, createdAt, updatedAt: createdAt },
    { id: makeId(), householdId: snapshot.household.id, title: "Extra game time", cost: 50, icon: "🎮", active: true, createdAt, updatedAt: createdAt },
  ];
  snapshot.rewardGoals = [
    { id: makeId(), householdId: snapshot.household.id, title: "Family movie night", targetStars: 500, active: true, createdAt, updatedAt: createdAt },
  ];

  return snapshot;
}

/** A denser fictional fixture used to exercise member filters and responsive layouts. */
export function createEightPersonTestHousehold(): HouseholdSnapshot {
  const snapshot = createHousehold("The River House · Test Bench", [
    "Maya",
    "Jordan",
    "Nana Jo",
    "Theo",
    "Ari",
    "Zuri",
    "Kai",
    "Sam",
  ]);
  const [maya, jordan, jo, theo, ari, zuri, kai, sam] = snapshot.members;
  const now = new Date();
  const at = (days: number, hours: number, minutes = 0) => {
    const result = new Date(now);
    result.setDate(result.getDate() + days);
    result.setHours(hours, minutes, 0, 0);
    return result.toISOString();
  };
  const createdAt = now.toISOString();
  snapshot.members = snapshot.members.map((member, index) => ({
    ...member,
    role: index < 2 ? "parent" : index === 2 ? "grandparent" : index < 6 ? "child" : "teen",
    rewardApprovalRequired: index >= 3 && index < 6,
  }));
  snapshot.scheduleItems = [
    ["School drop-off", [theo.id, ari.id], 0, 8, 10, "event"],
    ["Breakfast club", [zuri.id, kai.id], 0, 7, 30, "event"],
    ["Work focus", [maya.id, jordan.id], 0, 9, 0, "event"],
    ["Library club", [jo.id, sam.id], 0, 13, 30, "event"],
    ["Soccer practice", [theo.id], 0, 16, 30, "event"],
    ["Back-to-school night", [zuri.id, maya.id], 7, 18, 0, "event"],
    ["School closed", [zuri.id, kai.id], 11, 0, 0, "school-closure"],
    ["Family dinner", snapshot.members.map((member) => member.id), 1, 18, 30, "event"],
    ["Dentist appointment", [ari.id, jordan.id], 4, 15, 0, "reminder"],
    ["Park day", [jo.id, theo.id, ari.id, zuri.id], 9, 10, 0, "event"],
    ["Early dismissal", [theo.id, ari.id], 14, 0, 0, "early-dismissal"],
  ].map(([title, memberIds, day, hour, minute, kind]) => ({
    id: crypto.randomUUID(),
    householdId: snapshot.household.id,
    title: String(title),
    memberIds: memberIds as string[],
    startsAt: at(Number(day), Number(hour), Number(minute)),
    endsAt: at(Number(day), Number(hour) + (kind === "school-closure" ? 8 : 1), Number(minute)),
    allDay: kind === "school-closure" || kind === "early-dismissal",
    kind: kind as ScheduleItem["kind"],
    calendarDate: at(Number(day), 12).slice(0, 10),
    createdAt,
    updatedAt: createdAt,
  }));
  snapshot.tasks = [
    ["Feed Pepper", [ari.id]],
    ["Pack school bags", [theo.id, ari.id, zuri.id, kai.id]],
    ["Bring recycling out", [theo.id]],
    ["Water the herbs", [jo.id]],
    ["Check permission slips", [maya.id]],
    ["Lay out clothes", [zuri.id]],
    ["Charge the tablet", [sam.id]],
    ["Pick up groceries", [maya.id, jordan.id]],
    ["Tidy the playroom", [theo.id, ari.id]],
    ["Review tomorrow", [jordan.id]],
  ].map(([title, assigneeIds], index) => ({
    id: crypto.randomUUID(),
    householdId: snapshot.household.id,
    title: String(title),
    assigneeIds: assigneeIds as string[],
    dueDate: new Date(now.getTime() + (index % 4) * 86_400_000).toISOString().slice(0, 10),
    completedAt: index === 3 ? createdAt : undefined,
    starValue: [10, 15, 10, 5, 15, 10, 5, 20, 15, 5][index],
    createdAt,
    updatedAt: createdAt,
  }));
  snapshot.routines = [
    { id: crypto.randomUUID(), householdId: snapshot.household.id, title: "Morning reset", assigneeIds: [theo.id, ari.id, zuri.id], frequency: "school-days", createdAt, updatedAt: createdAt },
    { id: crypto.randomUUID(), householdId: snapshot.household.id, title: "Laundry day", assigneeIds: [maya.id, jordan.id], frequency: "weekly", weekdays: [6], createdAt, updatedAt: createdAt },
  ];
  snapshot.rewardDefinitions = [
    { id: crypto.randomUUID(), householdId: snapshot.household.id, title: "Choose dinner", cost: 75, icon: "🍕", active: true, createdAt, updatedAt: createdAt },
    { id: crypto.randomUUID(), householdId: snapshot.household.id, title: "Extra game time", cost: 50, icon: "🎮", active: true, createdAt, updatedAt: createdAt },
    { id: crypto.randomUUID(), householdId: snapshot.household.id, title: "Skip one chore", cost: 100, icon: "🛌", active: true, createdAt, updatedAt: createdAt },
  ];
  snapshot.rewardGoals = [
    { id: crypto.randomUUID(), householdId: snapshot.household.id, title: "Family movie night", targetStars: 800, active: true, createdAt, updatedAt: createdAt },
  ];
  snapshot.activities = snapshot.tasks.filter((task) => task.completedAt).map((task) => ({ id: crypto.randomUUID(), householdId: snapshot.household.id, type: "completion" as const, entityId: task.id, memberIds: task.assigneeIds, summary: `${task.title} completed`, createdAt }));
  return snapshot;
}
