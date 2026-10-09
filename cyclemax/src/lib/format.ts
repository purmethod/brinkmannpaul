import { addDays, diffDays, type DateStr } from "@/engine/dates";

const fmt = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function dayLabel(date: DateStr, today: DateStr): string {
  const d = diffDays(date, today);
  if (d === 0) return "Heute";
  if (d === 1) return "Gestern";
  return fmt.format(new Date(`${date}T00:00:00Z`)).replace(/\.,/, ",");
}

/** Wheel options: today back to `days` days ago. */
export function pastDays(today: DateStr, days = 60): { value: DateStr; label: string }[] {
  return Array.from({ length: days + 1 }, (_, i) => {
    const value = addDays(today, -i);
    return { value, label: dayLabel(value, today) };
  });
}
