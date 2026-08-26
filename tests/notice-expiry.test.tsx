import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getExpiryStatus } from "@/features/noticeboard/notice-expiry-badge";

// Fixed "now" so threshold math is deterministic.
const NOW = new Date("2026-08-26T10:00:00Z");
const daysFromNow = (days: number) =>
  new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

describe("getExpiryStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns active when expiry is 10 days away", () => {
    expect(getExpiryStatus(daysFromNow(10))).toBe("active");
  });

  it("returns active when expiry is 4 days away (just outside the 3-day window)", () => {
    expect(getExpiryStatus(daysFromNow(4))).toBe("active");
  });

  it("returns expiring at the exact 3-day threshold", () => {
    expect(getExpiryStatus(daysFromNow(3))).toBe("expiring");
  });

  it("returns expiring when expiry is 2 days away", () => {
    expect(getExpiryStatus(daysFromNow(2))).toBe("expiring");
  });

  it("returns expired when expiry was yesterday", () => {
    expect(getExpiryStatus(daysFromNow(-1))).toBe("expired");
  });

  it("returns expired at the exact expiry instant (expiry <= now)", () => {
    expect(getExpiryStatus(NOW.toISOString())).toBe("expired");
  });
});
