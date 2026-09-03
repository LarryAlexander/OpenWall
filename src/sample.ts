import { formatDate } from "./date";
import type { HouseholdSnapshot, MemberColorToken } from "./types";

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

  return snapshot;
}
