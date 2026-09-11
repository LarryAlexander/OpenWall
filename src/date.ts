export function parseISO(value: string): Date {
  return new Date(value);
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function formatDate(date: Date, pattern: string): string {
  if (pattern === "yyyy-MM-dd") {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (pattern === "HH:mm") {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (pattern === "EEEE") {
    return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  }
  if (pattern === "d") {
    return new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(date);
  }
  if (pattern === "MMMM d") {
    return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(date);
  }
  if (pattern === "MMM d") {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  }
  if (pattern === "MMMM yyyy") {
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
  }
  if (pattern === "MMMM d, yyyy") {
    return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(date);
  }
  if (pattern === "EEEE, MMMM d") {
    return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(date);
  }
  if (pattern === "MMM d, h:mm a") {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
  }
  if (pattern === "MMM d · h:mm a") {
    const day = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
    const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
    return `${day} · ${clock}`;
  }
  if (pattern === "EEE, MMM d · h:mm a") {
    const day = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date);
    const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
    return `${day} · ${clock}`;
  }
  if (pattern === "a") return date.getHours() < 12 ? "AM" : "PM";
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: pattern === "h:mm" || pattern === "h:mm a" ? "2-digit" : undefined,
  }).format(date);
  return pattern === "h:mm" ? time.replace(/\s?(AM|PM)$/i, "") : time;
}
