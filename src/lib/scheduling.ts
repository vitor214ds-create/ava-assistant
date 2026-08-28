export type HourRow = {
  weekday: number;
  is_open: boolean;
  opens_at: string;
  closes_at: string;
  break_start?: string | null;
  break_end?: string | null;
};

export type Busy = { starts_at: string; ends_at: string };

function toMinutes(time: string) {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function minutesToTime(mins: number) {
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

/** Builds ISO slots for a given local date (yyyy-mm-dd) respecting hours, breaks and busy blocks. */
export function computeSlots(options: {
  date: string;
  hours: HourRow | undefined;
  durationMinutes: number;
  busy: Busy[];
  stepMinutes?: number;
  now?: Date;
}): string[] {
  const { date, hours, durationMinutes, busy, stepMinutes = 15, now = new Date() } = options;
  if (!hours || !hours.is_open) return [];

  const open = toMinutes(hours.opens_at);
  const close = toMinutes(hours.closes_at);
  const breakStart = hours.break_start ? toMinutes(hours.break_start) : null;
  const breakEnd = hours.break_end ? toMinutes(hours.break_end) : null;

  const busyRanges = busy.map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));

  const slots: string[] = [];
  for (let m = open; m + durationMinutes <= close; m += stepMinutes) {
    if (breakStart !== null && breakEnd !== null && m < breakEnd && m + durationMinutes > breakStart) continue;
    const start = new Date(`${date}T${minutesToTime(m)}:00`);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    if (start.getTime() <= now.getTime()) continue;
    const overlaps = busyRanges.some((b) => start.getTime() < b.end && end.getTime() > b.start);
    if (overlaps) continue;
    slots.push(start.toISOString());
  }
  return slots;
}

export function formatSlot(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

export function toLocalDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
