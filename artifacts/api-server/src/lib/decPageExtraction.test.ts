import { describe, test, expect } from "vitest";
import { parseDecPageResponse } from "./routeHelpers.js";

const FULL_VALID = JSON.stringify({
  first_name: "Sarah",
  last_name: "Chen",
  vehicle_make: "Honda",
  vehicle_model: "Civic",
  vehicle_year: "2019",
  vin: "2HGFC2F59KH123456",
  annual_mileage: "15000",
  primary_use: "commute",
  deductible: "1000",
  monthly_premium: "187",
  current_carrier: "Intact Insurance",
  location: "Toronto, ON",
});

describe("parseDecPageResponse — happy path", () => {
  test("Parses a complete valid response", () => {
    const result = parseDecPageResponse(FULL_VALID);
    expect(result.first_name).toBe("Sarah");
    expect(result.vehicle_make).toBe("Honda");
    expect(result.vehicle_year).toBe("2019");
    expect(result.primary_use).toBe("commute");
    expect(result.deductible).toBe("1000");
    expect(result.monthly_premium).toBe("187");
  });

  test("Strips markdown code fences from Claude response", () => {
    const withFences = "```json\n" + FULL_VALID + "\n```";
    const result = parseDecPageResponse(withFences);
    expect(result.first_name).toBe("Sarah");
  });

  test("Strips ```json (no newline) fence variant", () => {
    const withFences = "```json" + FULL_VALID + "```";
    const result = parseDecPageResponse(withFences);
    expect(result.vehicle_make).toBe("Honda");
  });

  test("Trims whitespace from string fields", () => {
    const padded = JSON.stringify({ ...JSON.parse(FULL_VALID), first_name: "  Sarah  " });
    const result = parseDecPageResponse(padded);
    expect(result.first_name).toBe("Sarah");
  });
});

describe("parseDecPageResponse — null handling", () => {
  test("Returns null for fields explicitly set to null", () => {
    const partial = JSON.stringify({ ...JSON.parse(FULL_VALID), vin: null });
    const result = parseDecPageResponse(partial);
    expect(result.vin).toBeNull();
  });

  test("Returns null for fields that are missing entirely", () => {
    const noVin = JSON.stringify({ first_name: "Sarah", vehicle_make: "Honda" });
    const result = parseDecPageResponse(noVin);
    expect(result.vin).toBeNull();
    expect(result.deductible).toBeNull();
  });

  test("Returns null for empty string fields", () => {
    const emptyVin = JSON.stringify({ ...JSON.parse(FULL_VALID), vin: "" });
    const result = parseDecPageResponse(emptyVin);
    expect(result.vin).toBeNull();
  });

  test("Converts numeric values to string (year as number)", () => {
    const numericYear = JSON.stringify({ ...JSON.parse(FULL_VALID), vehicle_year: 2019 });
    const result = parseDecPageResponse(numericYear);
    expect(result.vehicle_year).toBe("2019");
  });
});

describe("parseDecPageResponse — primary_use validation", () => {
  test("Accepts valid primary_use values", () => {
    for (const use of ["commute", "pleasure", "business", "farm"] as const) {
      const input = JSON.stringify({ primary_use: use });
      expect(parseDecPageResponse(input).primary_use).toBe(use);
    }
  });

  test("Returns null for unknown primary_use value", () => {
    const bad = JSON.stringify({ primary_use: "to/from work" });
    expect(parseDecPageResponse(bad).primary_use).toBeNull();
  });

  test("Returns null for null primary_use", () => {
    const nullUse = JSON.stringify({ primary_use: null });
    expect(parseDecPageResponse(nullUse).primary_use).toBeNull();
  });
});

describe("parseDecPageResponse — malformed input", () => {
  test("Returns all-null object for completely invalid JSON", () => {
    const result = parseDecPageResponse("not json at all");
    expect(result.first_name).toBeNull();
    expect(result.vehicle_make).toBeNull();
    expect(result.deductible).toBeNull();
  });

  test("Returns all-null object for empty string input", () => {
    const result = parseDecPageResponse("");
    expect(Object.values(result).every(v => v === null)).toBe(true);
  });

  test("Returns all-null object for JSON array (wrong shape)", () => {
    const result = parseDecPageResponse("[1, 2, 3]");
    expect(Object.values(result).every(v => v === null)).toBe(true);
  });

  test("Does not throw for any input", () => {
    const inputs = ["", "null", "{}", "[]", "undefined", "true", FULL_VALID];
    for (const input of inputs) {
      expect(() => parseDecPageResponse(input)).not.toThrow();
    }
  });
});

describe("parseDecPageResponse — form field merging contract", () => {
  test("All returned keys match exactly the 12 Apply form fieldIds", () => {
    const expectedKeys = [
      "first_name", "last_name", "vehicle_make", "vehicle_model", "vehicle_year",
      "vin", "annual_mileage", "primary_use", "deductible", "monthly_premium",
      "current_carrier", "location",
    ];
    const result = parseDecPageResponse(FULL_VALID);
    expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
  });

  test("Partial extraction only fills non-null fields — null fields ignored in merge", () => {
    const partial = parseDecPageResponse(JSON.stringify({
      vehicle_make: "Honda",
      deductible: "500",
    }));
    const nonNull = Object.entries(partial)
      .filter(([, v]) => v !== null)
      .map(([k]) => k);
    expect(nonNull).toEqual(["vehicle_make", "deductible"]);
  });
});
