// ========================
// IST DATE UTILITIES
// ========================
// All date display and conversion goes through this module (D-09/D-18).
// Uses Intl.DateTimeFormat with explicit timeZone: "Asia/Kolkata" so output
// is identical regardless of browser timezone.

const IST = "Asia/Kolkata";

function ISTFormat(
  iso: string | null | Date | undefined,
  options: Intl.DateTimeFormatOptions,
): Date | null {
  if (!iso) return null;
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function istParts(
  date: Date,
  opts: Intl.DateTimeFormatOptions,
): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    ...opts,
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    map[p.type] = p.value;
  }
  return map;
}

// ========================
// DISPLAY FORMATTERS
// ========================

export const formatIstDate = (
  iso?: string | null | Date,
): string => {
  const d = ISTFormat(iso ?? null, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!d) return "--";
  const p = istParts(d, { day: "2-digit", month: "short", year: "numeric" });
  return `${p.day} ${p.month} ${p.year}`;
};

export const formatIstDateTime = (
  iso?: string | null | Date,
): string => {
  const d = ISTFormat(iso ?? null, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (!d) return "--";
  const p = istParts(d, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} ${p.dayPeriod.toUpperCase()}`;
};

// ========================
// INPUT/ISO CONVERTERS
// ========================

export const isoToIstInput = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = istParts(d, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

export const isoToIstWallClock = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = istParts(d, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
};

export const istInputToIso = (value: string): string => {
  return `${value}:00+05:30`;
};

export const dateInputToIso = (value: string): string => {
  return `${value}T00:00:00+05:30`;
};

export const combineDateAndTimeToIso = (
  date: string,
  time: string,
): string => {
  return `${date}T${time}:00+05:30`;
};

// ========================
// DURATION HELPERS
// ========================

export const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

export const calculateWorkHours = (
  checkIn: string | null | Date,
  checkOut: string | null | Date,
): string => {
  if (!checkIn || !checkOut) return "--";

  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return `${hours}h ${minutes}m`;
};

// ========================
// MONTH/YEAR
// ========================

export const getMonthYear = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const p = istParts(d, { month: "long", year: "numeric" });
  return `${p.month} ${p.year}`;
};
