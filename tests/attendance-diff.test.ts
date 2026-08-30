import { describe, expect, it } from "vitest";
import { computeAttendanceDiff } from "@/lib/attendance-diff";

describe("computeAttendanceDiff", () => {
  it("nothing existing, both selected -> all added", () => {
    expect(computeAttendanceDiff([], ["p1", "p2"])).toEqual({
      added: ["p1", "p2"],
      removed: [],
    });
  });

  it("all deselected -> all removed", () => {
    expect(computeAttendanceDiff(["p1", "p2"], [])).toEqual({
      added: [],
      removed: ["p1", "p2"],
    });
  });

  it("overlap untouched -> only real additions and removals", () => {
    expect(computeAttendanceDiff(["p1", "p2"], ["p2", "p3"])).toEqual({
      added: ["p3"],
      removed: ["p1"],
    });
  });

  it("no change -> empty diff", () => {
    expect(computeAttendanceDiff(["p1", "p2"], ["p1", "p2"])).toEqual({
      added: [],
      removed: [],
    });
  });

  it("order-insensitive (Set semantics, not index comparison)", () => {
    expect(computeAttendanceDiff(["p2", "p1"], ["p1", "p2"])).toEqual({
      added: [],
      removed: [],
    });
  });
});