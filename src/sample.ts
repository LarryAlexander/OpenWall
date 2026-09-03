import { addMinutes, endOfDay, formatISO, set } from "date-fns";
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
  const at = (hours: number, minutes = 0) =>
    set(now, { hours, minutes, seconds: 0, milliseconds: 0 });
  const createdAt = now.toISOString();

  snapshot.scheduleItems = [
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "School drop-off",
      memberIds: [theo.id, ari.id],
      startsAt: formatISO(at(8, 10)),
      endsAt: formatISO(at(8, 40)),
      allDay: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Design review",
      memberIds: [maya.id],
      startsAt: formatISO(at(10)),
      endsAt: formatISO(at(11)),
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
      startsAt: formatISO(at(13, 30)),
      endsAt: formatISO(at(14, 30)),
      allDay: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Soccer practice",
      memberIds: [theo.id],
      startsAt: formatISO(at(16, 30)),
      endsAt: formatISO(at(18)),
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
      startsAt: formatISO(at(18, 30)),
      endsAt: formatISO(addMinutes(at(18, 30), 60)),
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
      dueDate: formatISO(endOfDay(now), { representation: "date" }),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Bring recycling out",
      assigneeIds: [theo.id],
      dueDate: formatISO(endOfDay(now), { representation: "date" }),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Pick up groceries",
      assigneeIds: [maya.id, jo.id],
      dueDate: formatISO(endOfDay(now), { representation: "date" }),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: makeId(),
      householdId: snapshot.household.id,
      title: "Water the herbs",
      assigneeIds: [jo.id],
      dueDate: formatISO(endOfDay(now), { representation: "date" }),
      completedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  return snapshot;
}
