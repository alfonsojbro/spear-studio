import { describe, expect, it } from "vitest";
import { formatUtcOffset, isValidTimeZone, listTimeZones } from "../src/timezone";

describe("isValidTimeZone", () => {
  it("accepts IANA names", () => {
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("America/Managua")).toBe(true);
    expect(isValidTimeZone("Europe/Madrid")).toBe(true);
    expect(isValidTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
  });

  it("rejects junk, offsets, abbreviations and padded values", () => {
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("+02:00")).toBe(false);
    expect(isValidTimeZone("-0500")).toBe(false);
    expect(isValidTimeZone("PST")).toBe(false);
    expect(isValidTimeZone(" UTC")).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
    expect(isValidTimeZone(3)).toBe(false);
  });
});

describe("listTimeZones", () => {
  it("returns a sorted list that includes UTC and common zones", () => {
    const zones = listTimeZones();
    expect(zones).toContain("UTC");
    expect(zones).toContain("America/New_York");
    expect([...zones].sort((a, b) => a.localeCompare(b))).toEqual(zones);
    expect(new Set(zones).size).toBe(zones.length);
  });
});

describe("formatUtcOffset", () => {
  it("formats fixed offsets", () => {
    expect(formatUtcOffset("UTC")).toBe("UTC+00:00");
    // Managua has no DST.
    expect(formatUtcOffset("America/Managua", new Date("2026-07-01T12:00:00Z"))).toBe("UTC-06:00");
  });

  it("follows DST", () => {
    expect(formatUtcOffset("America/New_York", new Date("2026-01-15T12:00:00Z"))).toBe("UTC-05:00");
    expect(formatUtcOffset("America/New_York", new Date("2026-07-15T12:00:00Z"))).toBe("UTC-04:00");
  });

  it("throws on unknown zones", () => {
    expect(() => formatUtcOffset("Nope/Zone")).toThrow(RangeError);
  });
});
