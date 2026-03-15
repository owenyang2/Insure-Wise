import { describe, test, expect } from "vitest";
import {
  inferRegion,
  inferProvince,
  extractPostalPrefix,
  computeGapCount,
  savingsBand,
  impactLevel,
} from "./routeHelpers.js";

// ─── inferRegion ──────────────────────────────────────────────────────────────

describe("inferRegion", () => {
  test("Toronto maps to ON_urban", () => {
    expect(inferRegion("Toronto, ON")).toBe("ON_urban");
  });
  test("Scarborough maps to ON_urban", () => {
    expect(inferRegion("Scarborough")).toBe("ON_urban");
  });
  test("Mississauga maps to ON_sub", () => {
    expect(inferRegion("Mississauga, ON")).toBe("ON_sub");
  });
  test("Ottawa maps to ON_rural", () => {
    expect(inferRegion("Ottawa, Ontario")).toBe("ON_rural");
  });
  test("Vancouver maps to BC_urban", () => {
    expect(inferRegion("Vancouver, BC")).toBe("BC_urban");
  });
  test("Calgary maps to AB", () => {
    expect(inferRegion("Calgary, AB")).toBe("AB");
  });
  test("Montreal maps to QC", () => {
    expect(inferRegion("Montreal, QC")).toBe("QC");
  });
  test("Unknown city falls back to ON_sub", () => {
    expect(inferRegion("Smalltown, Nowhere")).toBe("ON_sub");
  });
  test("Case-insensitive matching", () => {
    expect(inferRegion("TORONTO")).toBe("ON_urban");
    expect(inferRegion("toronto")).toBe("ON_urban");
  });
});

// ─── inferProvince ────────────────────────────────────────────────────────────

describe("inferProvince", () => {
  test("Ontario returns ON", () => {
    expect(inferProvince("Toronto, Ontario")).toBe("ON");
  });
  test("BC returns BC", () => {
    expect(inferProvince("Vancouver, BC")).toBe("BC");
  });
  test("Alberta returns AB", () => {
    expect(inferProvince("Edmonton, AB")).toBe("AB");
  });
  test("Quebec returns QC", () => {
    expect(inferProvince("Montreal, QC")).toBe("QC");
  });
  test("Nova Scotia returns AT", () => {
    expect(inferProvince("Halifax, Nova Scotia")).toBe("AT");
  });
  test("Unknown falls back to ON", () => {
    expect(inferProvince("Somewhere")).toBe("ON");
  });
});

// ─── extractPostalPrefix ──────────────────────────────────────────────────────

describe("extractPostalPrefix", () => {
  test("Extracts FSA from a full postal code in location string", () => {
    expect(extractPostalPrefix("Toronto M5V 2T6")).toBe("M");
  });
  test("Toronto city name returns M", () => {
    expect(extractPostalPrefix("Toronto, ON")).toBe("M");
  });
  test("Mississauga returns L", () => {
    expect(extractPostalPrefix("Mississauga")).toBe("L");
  });
  test("Ottawa returns K", () => {
    expect(extractPostalPrefix("Ottawa")).toBe("K");
  });
  test("Vancouver returns V", () => {
    expect(extractPostalPrefix("Vancouver")).toBe("V");
  });
  test("Calgary returns T", () => {
    expect(extractPostalPrefix("Calgary")).toBe("T");
  });
  test("Unknown location returns first character uppercased", () => {
    const result = extractPostalPrefix("Zeldaville");
    expect(result).toBe("Z");
  });
});

// ─── computeGapCount ─────────────────────────────────────────────────────────

describe("computeGapCount", () => {
  test("Returns 0 when all requirements are standard coverage items", () => {
    const gaps = computeGapCount(["liability", "collision"], "auto");
    expect(gaps).toBe(0);
  });
  test("Returns 1 for one non-standard requirement", () => {
    const gaps = computeGapCount(["liability", "roadside assistance"], "auto");
    expect(gaps).toBe(1);
  });
  test("Returns 0 for empty requirements array", () => {
    expect(computeGapCount([], "auto")).toBe(0);
  });
  test("Gap count is 0 when requirements exactly match standard home coverage", () => {
    const gaps = computeGapCount(["dwelling", "contents", "personal liability"], "home");
    expect(gaps).toBe(0);
  });
  test("Unknown insurance type falls back to auto standard coverage", () => {
    expect(() => computeGapCount(["liability"], "spaceship")).not.toThrow();
  });
  test("Case-insensitive requirement matching", () => {
    const gaps = computeGapCount(["LIABILITY", "COLLISION"], "auto");
    expect(gaps).toBe(0);
  });
});

// ─── savingsBand ──────────────────────────────────────────────────────────────

describe("savingsBand", () => {
  test("Default spread: min is 85% of saving, max is 115%", () => {
    const [lo, hi] = savingsBand(100);
    expect(lo).toBe(85);
    expect(hi).toBe(115);
  });
  test("Min is always at least 1 even for tiny savings", () => {
    const [lo] = savingsBand(0.5);
    expect(lo).toBeGreaterThanOrEqual(1);
  });
  test("Custom spread is respected", () => {
    const [lo, hi] = savingsBand(200, 0.5, 1.5);
    expect(lo).toBe(100);
    expect(hi).toBe(300);
  });
  test("Returns rounded integers", () => {
    const [lo, hi] = savingsBand(10);
    expect(Number.isInteger(lo)).toBe(true);
    expect(Number.isInteger(hi)).toBe(true);
  });
  test("lo is always <= hi", () => {
    for (const v of [1, 5, 10, 50, 200]) {
      const [lo, hi] = savingsBand(v);
      expect(lo).toBeLessThanOrEqual(hi);
    }
  });
});

// ─── impactLevel ──────────────────────────────────────────────────────────────

describe("impactLevel", () => {
  test("Returns high for large savings", () => {
    expect(impactLevel(25)).toBe("high");
  });
  test("Returns medium for mid savings", () => {
    expect(impactLevel(12)).toBe("medium");
  });
  test("Returns low for small savings", () => {
    expect(impactLevel(3)).toBe("low");
  });
  test("Boundary: exactly at threshHigh is high", () => {
    expect(impactLevel(20)).toBe("high");
  });
  test("Boundary: exactly at threshMed is medium", () => {
    expect(impactLevel(8)).toBe("medium");
  });
  test("Custom thresholds are respected", () => {
    expect(impactLevel(50, 100, 40)).toBe("medium");
    expect(impactLevel(150, 100, 40)).toBe("high");
    expect(impactLevel(10, 100, 40)).toBe("low");
  });
});
