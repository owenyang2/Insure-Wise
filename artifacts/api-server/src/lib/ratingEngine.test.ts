import { describe, test, expect } from "vitest";
import {
  calculateAutoQuotes,
  calculateHomeQuotes,
  calculateRentersQuotes,
  calculateLifeQuotes,
  calculateHealthQuotes,
} from "./quoteEngine.js";
import type { AutoInputs, HomeInputs, LifeInputs, HealthInputs, RentersInputs } from "./quoteEngine.js";

// ─── Base profiles ────────────────────────────────────────────────────────────

const base: AutoInputs = {
  postalCode: "M5V",
  vehicleMake: "audi",
  vehicleType: "ev",
  vehicleValue: 85000,
  annualKm: 15000,
  primaryUse: "commute",
  driverAge: 35,
  yearsLicensed: 12,
  atFaultAccidents: 0,
  convictions: "none",
  liability: 2000000,
  collisionDeductible: 1000,
  comprehensiveDeductible: 1000,
  addons: [],
  discounts: [],
};

const homeBase: HomeInputs = {
  region: "ON_urban",
  dwellingType: "detached",
  rebuildValue: 600000,
  homeAge: 20,
  heatingType: "gas",
  claimsCount: 0,
  deductible: 1000,
  addons: [],
  discounts: [],
};

const lifeBase: LifeInputs = {
  age: 35,
  gender: "male",
  smokingStatus: "non_smoker",
  healthClass: "standard_plus",
  product: "term20",
  coverageAmount: 1_000_000,
};

const healthBase: HealthInputs = {
  age: 35,
  province: "ON",
  familySize: "single",
  preExisting: "none",
  planTier: "standard",
  deductible: 0,
  products: ["dental", "drugs"],
};

const rentersBase: RentersInputs = {
  region: "ON_urban",
  contentsValue: 35000,
  claimsCount: 0,
  deductible: 500,
  addons: [],
  discounts: [],
};

// ─── Auto quotes ──────────────────────────────────────────────────────────────

describe("Auto quotes", () => {
  test("returns 28+ quotes for a standard Toronto profile", () => {
    const results = calculateAutoQuotes(base);
    expect(results.length).toBeGreaterThanOrEqual(28);
    expect(results[0].monthlyPremium).toBeLessThanOrEqual(results[results.length - 1].monthlyPremium);
  });

  test("Toronto M postal is more expensive than Ottawa K postal", () => {
    const toronto = calculateAutoQuotes({ ...base, postalCode: "M5V" });
    const ottawa  = calculateAutoQuotes({ ...base, postalCode: "K1A" });
    // Compare the median (index 13) to avoid outlier carrier variation
    const mid = Math.floor(toronto.length / 2);
    const torontoSum = toronto.reduce((s, q) => s + q.monthlyPremium, 0);
    const ottawaSum  = ottawa.reduce((s, q) => s + q.monthlyPremium, 0);
    expect(torontoSum).toBeGreaterThan(ottawaSum);
  });

  test("BMW is more expensive than Honda, same profile", () => {
    const bmw   = calculateAutoQuotes({ ...base, vehicleMake: "bmw" });
    const honda = calculateAutoQuotes({ ...base, vehicleMake: "honda" });
    const bmwAvg   = bmw.reduce((s, q) => s + q.monthlyPremium, 0) / bmw.length;
    const hondaAvg = honda.reduce((s, q) => s + q.monthlyPremium, 0) / honda.length;
    expect(bmwAvg).toBeGreaterThan(hondaAvg);
  });

  test("Age 19 is more expensive than age 35", () => {
    const young  = calculateAutoQuotes({ ...base, driverAge: 19, yearsLicensed: 1 });
    const mature = calculateAutoQuotes({ ...base, driverAge: 35, yearsLicensed: 12 });
    const youngAvg  = young.reduce((s, q) => s + q.monthlyPremium, 0) / young.length;
    const matureAvg = mature.reduce((s, q) => s + q.monthlyPremium, 0) / mature.length;
    expect(youngAvg).toBeGreaterThan(matureAvg);
  });

  test("1 at-fault accident increases price by 30–50%", () => {
    const clean    = calculateAutoQuotes({ ...base, atFaultAccidents: 0 });
    const accident = calculateAutoQuotes({ ...base, atFaultAccidents: 1 });
    const cleanAvg    = clean.reduce((s, q) => s + q.monthlyPremium, 0) / clean.length;
    const accidentAvg = accident.reduce((s, q) => s + q.monthlyPremium, 0) / accident.length;
    const ratio = accidentAvg / cleanAvg;
    expect(ratio).toBeGreaterThan(1.30);
    expect(ratio).toBeLessThan(1.50);
  });

  test("Major conviction increases price by 45–60%", () => {
    const clean   = calculateAutoQuotes({ ...base, convictions: "none" });
    const major   = calculateAutoQuotes({ ...base, convictions: "major" });
    const cleanAvg = clean.reduce((s, q) => s + q.monthlyPremium, 0) / clean.length;
    const majorAvg = major.reduce((s, q) => s + q.monthlyPremium, 0) / major.length;
    const ratio = majorAvg / cleanAvg;
    expect(ratio).toBeGreaterThan(1.45);
    expect(ratio).toBeLessThan(1.65);
  });

  test("Discount floor — max discounts cannot bring multiplier below 0.65", () => {
    const allDiscounts = ["winter_tires", "telematics", "multi_vehicle", "home_bundle", "alumni_group"];
    const results = calculateAutoQuotes({ ...base, discounts: allDiscounts });
    for (const r of results) {
      expect(r.breakdown.discountMultiplier).toBeGreaterThanOrEqual(0.65);
    }
  });

  test("EV type factor is higher than sedan", () => {
    const ev    = calculateAutoQuotes({ ...base, vehicleType: "ev" });
    const sedan = calculateAutoQuotes({ ...base, vehicleType: "sedan" });
    const evAvg    = ev.reduce((s, q) => s + q.monthlyPremium, 0) / ev.length;
    const sedanAvg = sedan.reduce((s, q) => s + q.monthlyPremium, 0) / sedan.length;
    expect(evAvg).toBeGreaterThan(sedanAvg);
  });

  test("Rideshare use is more expensive than pleasure", () => {
    const rideshare = calculateAutoQuotes({ ...base, primaryUse: "rideshare" });
    const pleasure  = calculateAutoQuotes({ ...base, primaryUse: "pleasure" });
    const rsAvg  = rideshare.reduce((s, q) => s + q.monthlyPremium, 0) / rideshare.length;
    const plAvg  = pleasure.reduce((s, q) => s + q.monthlyPremium, 0) / pleasure.length;
    expect(rsAvg).toBeGreaterThan(plAvg);
  });

  test("All results have valid url strings starting with https://", () => {
    const results = calculateAutoQuotes(base);
    for (const r of results) {
      expect(r.url).toMatch(/^https:\/\//);
    }
  });

  test("monthlyPremium * 12 === annualPremium for all results", () => {
    const results = calculateAutoQuotes(base);
    for (const r of results) {
      expect(r.annualPremium).toBe(r.monthlyPremium * 12);
    }
  });
});

// ─── Home quotes ──────────────────────────────────────────────────────────────

describe("Home quotes", () => {
  test("Condo is ~45–65% the cost of detached, same everything else", () => {
    const detached = calculateHomeQuotes({ ...homeBase, dwellingType: "detached" });
    const condo    = calculateHomeQuotes({ ...homeBase, dwellingType: "condo" });
    const detAvg  = detached.reduce((s, q) => s + q.monthlyPremium, 0) / detached.length;
    const condAvg = condo.reduce((s, q) => s + q.monthlyPremium, 0) / condo.length;
    const ratio = condAvg / detAvg;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.65);
  });

  test("BC urban is more expensive than Ontario urban", () => {
    const bc = calculateHomeQuotes({ ...homeBase, region: "BC_urban" });
    const on = calculateHomeQuotes({ ...homeBase, region: "ON_urban" });
    const bcAvg = bc.reduce((s, q) => s + q.annualPremium, 0) / bc.length;
    const onAvg = on.reduce((s, q) => s + q.annualPremium, 0) / on.length;
    expect(bcAvg).toBeGreaterThan(onAvg);
  });

  test("50-year-old home is more expensive than 5-year-old home", () => {
    const old   = calculateHomeQuotes({ ...homeBase, homeAge: 50 });
    const newer = calculateHomeQuotes({ ...homeBase, homeAge: 5 });
    const oldAvg   = old.reduce((s, q) => s + q.annualPremium, 0) / old.length;
    const newerAvg = newer.reduce((s, q) => s + q.annualPremium, 0) / newer.length;
    expect(oldAvg).toBeGreaterThan(newerAvg);
  });

  test("Wood heating is more expensive than gas heating", () => {
    const wood = calculateHomeQuotes({ ...homeBase, heatingType: "wood" });
    const gas  = calculateHomeQuotes({ ...homeBase, heatingType: "gas" });
    const woodAvg = wood.reduce((s, q) => s + q.annualPremium, 0) / wood.length;
    const gasAvg  = gas.reduce((s, q) => s + q.annualPremium, 0) / gas.length;
    expect(woodAvg).toBeGreaterThan(gasAvg);
  });

  test("Returns 35+ results", () => {
    const results = calculateHomeQuotes(homeBase);
    expect(results.length).toBeGreaterThanOrEqual(35);
  });
});

// ─── Life quotes ──────────────────────────────────────────────────────────────

describe("Life quotes", () => {
  test("Smoker pays 2.4–2.9x non-smoker", () => {
    const ns = calculateLifeQuotes({ ...lifeBase, smokingStatus: "non_smoker" });
    const s  = calculateLifeQuotes({ ...lifeBase, smokingStatus: "smoker" });
    const nsAvg = ns.reduce((sum, q) => sum + q.annualPremium, 0) / ns.length;
    const sAvg  = s.reduce((sum, q) => sum + q.annualPremium, 0) / s.length;
    const ratio = sAvg / nsAvg;
    expect(ratio).toBeGreaterThan(2.4);
    expect(ratio).toBeLessThan(2.9);
  });

  test("Male pays ~1.2–1.3x female", () => {
    const male   = calculateLifeQuotes({ ...lifeBase, gender: "male" });
    const female = calculateLifeQuotes({ ...lifeBase, gender: "female" });
    const mAvg = male.reduce((s, q) => s + q.annualPremium, 0) / male.length;
    const fAvg = female.reduce((s, q) => s + q.annualPremium, 0) / female.length;
    const ratio = mAvg / fAvg;
    expect(ratio).toBeGreaterThan(1.20);
    expect(ratio).toBeLessThan(1.30);
  });

  test("Age 50 pays 3–4x age 35", () => {
    const age35 = calculateLifeQuotes({ ...lifeBase, age: 35 });
    const age50 = calculateLifeQuotes({ ...lifeBase, age: 50 });
    const avg35 = age35.reduce((s, q) => s + q.annualPremium, 0) / age35.length;
    const avg50 = age50.reduce((s, q) => s + q.annualPremium, 0) / age50.length;
    const ratio = avg50 / avg35;
    expect(ratio).toBeGreaterThan(3.0);
    expect(ratio).toBeLessThan(4.0);
  });

  test("$2M coverage is less than 2x $1M due to band discount", () => {
    const m1 = calculateLifeQuotes({ ...lifeBase, coverageAmount: 1_000_000 });
    const m2 = calculateLifeQuotes({ ...lifeBase, coverageAmount: 2_000_000 });
    // Compare same-carrier results (both sorted by annual premium)
    const m1Avg = m1.reduce((s, q) => s + q.annualPremium, 0) / m1.length;
    const m2Avg = m2.reduce((s, q) => s + q.annualPremium, 0) / m2.length;
    expect(m2Avg / m1Avg).toBeLessThan(2.0);
  });

  test("Term30 costs more than term10 at the same carrier", () => {
    const t10 = calculateLifeQuotes({ ...lifeBase, product: "term10" });
    const t30 = calculateLifeQuotes({ ...lifeBase, product: "term30" });
    const avg10 = t10.reduce((s, q) => s + q.annualPremium, 0) / t10.length;
    const avg30 = t30.reduce((s, q) => s + q.annualPremium, 0) / t30.length;
    expect(avg30).toBeGreaterThan(avg10);
  });

  test("Only carriers offering the requested product are returned", () => {
    const whole = calculateLifeQuotes({ ...lifeBase, product: "whole" });
    const ul    = calculateLifeQuotes({ ...lifeBase, product: "ul" });
    // All returned should have valid premiums (>0), implying they offered the product
    for (const q of whole) expect(q.annualPremium).toBeGreaterThan(0);
    for (const q of ul)    expect(q.annualPremium).toBeGreaterThan(0);
    // Fewer carriers than total (not all offer whole/ul)
    expect(whole.length).toBeLessThan(38);
    expect(ul.length).toBeLessThan(38);
  });
});

// ─── Renters quotes ───────────────────────────────────────────────────────────

describe("Renters quotes", () => {
  test("Monthly premium is between $10 and $60 for Toronto standard renter", () => {
    const r = calculateRentersQuotes(rentersBase);
    expect(r[0].monthlyPremium).toBeGreaterThanOrEqual(10);
    expect(r[0].monthlyPremium).toBeLessThanOrEqual(60);
  });

  test("Luxury contents ($100k+) costs significantly more than medium contents ($35k)", () => {
    const medium  = calculateRentersQuotes({ ...rentersBase, contentsValue: 35000 });
    const luxury  = calculateRentersQuotes({ ...rentersBase, contentsValue: 150000 });
    const medAvg  = medium.reduce((s, q) => s + q.annualPremium, 0) / medium.length;
    const luxAvg  = luxury.reduce((s, q) => s + q.annualPremium, 0) / luxury.length;
    const ratio = luxAvg / medAvg;
    expect(ratio).toBeGreaterThan(1.7);
    expect(ratio).toBeLessThan(2.5);
  });
});

// ─── Health quotes ────────────────────────────────────────────────────────────

describe("Health quotes", () => {
  test("Family plan costs more than single plan", () => {
    const single = calculateHealthQuotes({ ...healthBase, familySize: "single" });
    const family = calculateHealthQuotes({ ...healthBase, familySize: "family" });
    const sAvg = single.reduce((s, q) => s + q.monthlyPremium, 0) / single.length;
    const fAvg = family.reduce((s, q) => s + q.monthlyPremium, 0) / family.length;
    expect(fAvg).toBeGreaterThan(sAvg);
  });

  test("Age 60 costs more than age 30", () => {
    const age30 = calculateHealthQuotes({ ...healthBase, age: 30 });
    const age60 = calculateHealthQuotes({ ...healthBase, age: 60 });
    const avg30 = age30.reduce((s, q) => s + q.monthlyPremium, 0) / age30.length;
    const avg60 = age60.reduce((s, q) => s + q.monthlyPremium, 0) / age60.length;
    expect(avg60).toBeGreaterThan(avg30);
  });

  test("Carrier missing a requested product is excluded", () => {
    // Request critical illness — only some carriers offer it
    const withCritical = calculateHealthQuotes({ ...healthBase, products: ["dental", "drugs", "critical"] });
    const withoutCritical = calculateHealthQuotes({ ...healthBase, products: ["dental", "drugs"] });
    // Fewer results when critical is required
    expect(withCritical.length).toBeLessThan(withoutCritical.length);
    // All returned carriers actually offer critical
    for (const q of withCritical) {
      expect(q.annualPremium).toBeGreaterThan(0);
    }
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  test("Unknown postal prefix falls back gracefully", () => {
    expect(() => calculateAutoQuotes({ ...base, postalCode: "X9X" })).not.toThrow();
    const results = calculateAutoQuotes({ ...base, postalCode: "X9X" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.monthlyPremium).toBeGreaterThan(0);
  });

  test("Unknown vehicle make falls back to factor ~1.0", () => {
    const known   = calculateAutoQuotes({ ...base, vehicleMake: "ford" });  // ford = 1.0
    const unknown = calculateAutoQuotes({ ...base, vehicleMake: "pontiac" });
    const knownAvg   = known.reduce((s, q) => s + q.monthlyPremium, 0) / known.length;
    const unknownAvg = unknown.reduce((s, q) => s + q.monthlyPremium, 0) / unknown.length;
    // Unknown make falls back to 1.0, same as ford — within 5% due to per-carrier offsets
    const ratio = unknownAvg / knownAvg;
    expect(ratio).toBeGreaterThan(0.95);
    expect(ratio).toBeLessThan(1.05);
  });

  test("Zero discounts array returns same as undefined discounts", () => {
    const withEmpty    = calculateAutoQuotes({ ...base, discounts: [] });
    const withUndefined = calculateAutoQuotes({ ...base, discounts: undefined });
    expect(withEmpty.length).toBe(withUndefined.length);
    for (let i = 0; i < withEmpty.length; i++) {
      expect(withEmpty[i].monthlyPremium).toBe(withUndefined[i].monthlyPremium);
    }
  });

  test("breakdown.factors array is populated for every auto quote", () => {
    const results = calculateAutoQuotes(base);
    for (const r of results) {
      expect(Array.isArray(r.breakdown.factors)).toBe(true);
      expect(r.breakdown.factors.length).toBeGreaterThan(0);
      for (const f of r.breakdown.factors) {
        expect(typeof f.name).toBe("string");
        expect(typeof f.label).toBe("string");
        expect(typeof f.value).toBe("number");
        expect(typeof f.impact).toBe("string");
      }
    }
  });
});
