import { describe, it, expect } from "vitest";
import {
  formatIstDate,
  formatIstDateTime,
  isoToIstInput,
  isoToIstWallClock,
  istInputToIso,
  dateInputToIso,
  combineDateAndTimeToIso,
  formatHours,
  calculateWorkHours,
  getMonthYear,
  dateToIstDateOnly,
  istDateOnlyToDate,
} from "@/lib/date";

describe("formatIstDate", () => {
  it("before IST midnight boundary", () => {
    expect(formatIstDate("2026-08-24T18:29:00Z")).toBe("24 Aug 2026");
  });

  it("AT IST midnight boundary (the off-by-one killer)", () => {
    expect(formatIstDate("2026-08-24T18:30:00Z")).toBe("25 Aug 2026");
  });

  it("returns -- for null", () => {
    expect(formatIstDate(null)).toBe("--");
  });

  it("returns -- for undefined", () => {
    expect(formatIstDate(undefined)).toBe("--");
  });

  it("returns -- for garbage string", () => {
    expect(formatIstDate("garbage")).toBe("--");
  });

  it("returns -- for empty string", () => {
    expect(formatIstDate("")).toBe("--");
  });
});

describe("formatIstDateTime", () => {
  it("midnight IST", () => {
    expect(formatIstDateTime("2026-08-24T18:30:00Z")).toBe(
      "25 Aug 2026, 12:00 AM",
    );
  });

  it("afternoon with uppercase meridiem", () => {
    expect(formatIstDateTime("2026-08-24T09:15:00Z")).toBe(
      "24 Aug 2026, 02:45 PM",
    );
  });
});

describe("isoToIstInput", () => {
  it("converts UTC Z to IST datetime-local value", () => {
    expect(isoToIstInput("2026-08-24T03:30:00.000Z")).toBe("2026-08-24T09:00");
  });
});

describe("isoToIstWallClock", () => {
  it("returns IST wall-clock digits without offset suffix", () => {
    expect(isoToIstWallClock("2026-08-24T03:30:00Z")).toBe(
      "2026-08-24T09:00:00",
    );
  });
});

describe("istInputToIso", () => {
  it("converts datetime-local value to +05:30 ISO", () => {
    expect(istInputToIso("2026-08-24T09:00")).toBe(
      "2026-08-24T09:00:00+05:30",
    );
  });

  it("instant-equivalence: parsed ISO equals same UTC instant", () => {
    const iso = istInputToIso("2026-08-24T09:00");
    const utc = new Date("2026-08-24T03:30:00Z");
    expect(new Date(iso).getTime()).toBe(utc.getTime());
  });
});

describe("dateInputToIso", () => {
  it("converts date-only value to IST midnight +05:30 ISO", () => {
    expect(dateInputToIso("2026-08-24")).toBe("2026-08-24T00:00:00+05:30");
  });

  it("instant-equivalence: parsed ISO equals IST midnight in UTC", () => {
    const iso = dateInputToIso("2026-08-24");
    const utc = new Date("2026-08-23T18:30:00Z"); // IST midnight = UTC 18:30 prev day
    expect(new Date(iso).getTime()).toBe(utc.getTime());
  });
});

describe("combineDateAndTimeToIso", () => {
  it("combines date and time to +05:30 ISO", () => {
    expect(combineDateAndTimeToIso("2026-08-24", "09:00")).toBe(
      "2026-08-24T09:00:00+05:30",
    );
  });
});

describe("round-trip", () => {
  it("istInputToIso(isoToIstInput(x)) === x for various instants", () => {
    const samples = [
      "2026-08-24T03:30:00Z",
      "2026-08-24T18:30:00Z",
      "2026-01-01T00:00:00Z",
      "2026-12-31T23:59:00Z",
    ];
    for (const x of samples) {
      const istInput = isoToIstInput(x);
      const back = istInputToIso(istInput);
      expect(new Date(back).getTime()).toBe(new Date(x).getTime());
    }
  });
});

describe("formatHours", () => {
  it("formats decimal hours to h m", () => {
    expect(formatHours(8.5)).toBe("8h 30m");
  });

  it("formats whole hours", () => {
    expect(formatHours(8)).toBe("8h 0m");
  });
});

describe("calculateWorkHours", () => {
  it("calculates work hours between two instants", () => {
    expect(
      calculateWorkHours("2026-08-24T04:00:00Z", "2026-08-24T12:30:00Z"),
    ).toBe("8h 30m");
  });

  it("returns -- when checkIn missing", () => {
    expect(calculateWorkHours(null, "2026-08-24T12:30:00Z")).toBe("--");
  });

  it("returns -- when checkOut missing", () => {
    expect(calculateWorkHours("2026-08-24T04:00:00Z", null)).toBe("--");
  });
});

describe("getMonthYear", () => {
  it("returns month and year in IST", () => {
    expect(getMonthYear("2026-08-24T18:30:00Z")).toBe("August 2026");
  });
});

describe("dateToIstDateOnly", () => {
  it("returns next IST day when instant falls after IST midnight", () => {
    expect(dateToIstDateOnly(new Date("2026-08-24T18:30:00Z"))).toBe(
      "2026-08-25",
    );
  });

  it("returns same IST day when instant is before IST midnight", () => {
    expect(dateToIstDateOnly(new Date("2026-08-24T03:30:00Z"))).toBe(
      "2026-08-24",
    );
  });
});

describe("istDateOnlyToDate", () => {
  it("returns IST midnight Date for a YYYY-MM-DD string", () => {
    const result = istDateOnlyToDate("2026-08-24");
    const expected = new Date("2026-08-24T00:00:00+05:30");
    expect(result.getTime()).toBe(expected.getTime());
  });

  it("round-trip preserves IST calendar day", () => {
    const original = new Date("2026-08-24T18:30:00Z");
    const dateOnly = dateToIstDateOnly(original);
    const roundTripped = istDateOnlyToDate(dateOnly);
    expect(dateToIstDateOnly(roundTripped)).toBe(dateOnly);
  });
});
