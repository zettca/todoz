import { describe, expect, it } from "vite-plus/test";
import { daysBetween, parseISODate, toISODate } from "./date";

describe("toISODate", () => {
  it("formats the local calendar date with zero padding", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toISODate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});

describe("parseISODate", () => {
  it("parses to local midnight", () => {
    const date = parseISODate("2026-03-09");
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 2, 9, 0,
    ]);
  });
  it("round-trips with toISODate", () => {
    expect(toISODate(parseISODate("2024-02-29"))).toBe("2024-02-29");
  });
});

describe("daysBetween", () => {
  it.each([
    ["2026-05-10", "2026-05-10", 0],
    ["2026-05-10", "2026-05-13", 3],
    ["2026-05-13", "2026-05-10", -3],
    ["2026-12-31", "2027-01-01", 1],
    ["2024-02-28", "2024-03-01", 2],
    // Whole days even across daylight-saving changes (23h / 25h days).
    ["2026-03-01", "2026-04-01", 31],
    ["2026-10-01", "2026-11-01", 31],
  ])("%s -> %s = %i", (from, to, expected) => {
    expect(daysBetween(from, to)).toBe(expected);
  });
});
