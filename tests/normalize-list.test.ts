import { describe, it, expect } from "vitest";
import { normalizeList } from "@/lib/normalize-list";

describe("normalizeList", () => {
  it("total-as-pages: meta {page:2, limit:7, count:20, total:3} → totalPages:3, totalRecords:20", () => {
    const res = normalizeList({
      data: [1, 2, 3],
      meta: { page: 2, limit: 7, count: 20, total: 3 },
    });
    expect(res).toEqual({
      items: [1, 2, 3],
      page: 2,
      limit: 7,
      totalPages: 3,
      totalRecords: 20,
    });
  });

  it("totalPages field: meta {..., totalPages:5} → totalPages:5", () => {
    const res = normalizeList({
      data: [1],
      meta: { page: 1, limit: 10, count: 50, totalPages: 5 },
    });
    expect(res.totalPages).toBe(5);
    expect(res.totalRecords).toBe(50);
  });

  it("data null → items:[]", () => {
    const res = normalizeList({ data: null, meta: { count: 10 } });
    expect(res.items).toEqual([]);
  });

  it("data undefined → items:[]", () => {
    const res = normalizeList({ data: undefined });
    expect(res.items).toEqual([]);
  });

  it("data non-array → items:[]", () => {
    const res = normalizeList({ data: "oops" as unknown as unknown[] });
    expect(res.items).toEqual([]);
  });

  it("meta absent entirely → defaults", () => {
    const res = normalizeList({ data: [1, 2, 3] });
    expect(res).toEqual({
      items: [1, 2, 3],
      page: 1,
      limit: 3,
      totalPages: 1,
      totalRecords: 3,
    });
  });

  it("meta absent + empty data → totalPages:0", () => {
    const res = normalizeList({ data: [] });
    expect(res.totalPages).toBe(0);
    expect(res.items).toEqual([]);
  });

  it("meta {count:0, totalPages:0} → totalPages:0 preserved", () => {
    const res = normalizeList({
      data: [],
      meta: { count: 0, totalPages: 0 },
    });
    expect(res.totalPages).toBe(0);
    expect(res.totalRecords).toBe(0);
  });

  it("meta {count:9} only (non-paging) → totalPages:1", () => {
    const res = normalizeList({ data: [1], meta: { count: 9 } });
    expect(res.totalPages).toBe(1);
    expect(res.totalRecords).toBe(9);
  });

  it("malformed string '3' coerces to number", () => {
    const res = normalizeList({
      data: [1],
      meta: { page: "2", limit: "7", count: "15", total: "4" },
    });
    expect(res).toEqual({
      items: [1],
      page: 2,
      limit: 7,
      totalPages: 4,
      totalRecords: 15,
    });
  });

  it("negative values fall back to defaults", () => {
    const res = normalizeList({
      data: [1],
      meta: { page: -1, limit: -5, total: -3 },
    });
    expect(res.page).toBe(1);
    expect(res.limit).toBe(1);
    expect(res.totalPages).toBe(1);
  });

  it("NaN and Infinity fall back to defaults", () => {
    const res = normalizeList({
      data: [1],
      meta: { page: NaN, limit: Infinity, total: NaN },
    });
    expect(res.page).toBe(1);
    expect(res.limit).toBe(1);
    expect(res.totalPages).toBe(1);
  });

  it("page < 1 clamps to 1", () => {
    const res = normalizeList({ data: [1], meta: { page: 0 } });
    expect(res.page).toBe(1);
  });

  it("empty paged result preserves totalPages:0", () => {
    const res = normalizeList({
      data: [],
      meta: { page: 3, limit: 10, count: 0, total: 0, totalPages: 0 },
    });
    expect(res.totalPages).toBe(0);
    expect(res.page).toBe(3);
  });
});
