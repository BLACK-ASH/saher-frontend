export type NormalizedList<T> = {
  items: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
};

function num(val: unknown, fallback: number): number {
  if (typeof val === "number" && Number.isFinite(val) && val >= 0) return val;
  if (typeof val === "string") {
    const n = Number(val);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return fallback;
}

export function normalizeList<T>(res: {
  data?: T[] | null;
  meta?: unknown;
}): NormalizedList<T> {
  const items = Array.isArray(res.data) ? res.data : [];
  const meta = res.meta && typeof res.meta === "object" ? res.meta : {};

  const m = meta as Record<string, unknown>;

  const rawPages = num(m.totalPages, NaN);
  const rawTotal = num(m.total, rawPages);
  const totalPages =
    Number.isFinite(rawTotal) && rawTotal >= 1
      ? rawTotal
      : Number.isFinite(rawPages) && rawPages >= 0
        ? rawPages
        : items.length > 0
          ? 1
          : 0;

  const page = Math.max(1, num(m.page, 1));
  const limit = num(m.limit, items.length || 10);
  const totalRecords = num(m.count, items.length);

  return { items, page, limit, totalPages, totalRecords };
}
