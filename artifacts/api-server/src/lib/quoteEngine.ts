import {
  AUTO_CARRIERS, TERRITORY_RANGES, MAKE_FACTORS, TYPE_FACTORS,
  VALUE_BANDS, AGE_BANDS, LICENSED_BANDS, ACCIDENT_FACTORS,
  CONVICTION_FACTORS, KM_BANDS, USE_FACTORS, LIABILITY_LOADING,
  COLLISION_DED_LOADING, COMP_DED_LOADING, ADDON_LOADING,
  DISCOUNT_VALUES, DISCOUNT_FLOOR,
} from "../data/rating-factors/auto.js";

import {
  HOME_CARRIERS, HOME_TERRITORY_MIDS, DWELLING_FACTORS,
  REBUILD_BANDS, HOME_AGE_BANDS, HEATING_FACTORS,
  HOME_CLAIMS_FACTORS, HOME_DED_LOADING, HOME_ADDON_LOADING,
  HOME_DISCOUNT_VALUES,
} from "../data/rating-factors/home.js";

import {
  RENTERS_CARRIERS, RENTERS_TERRITORY_MIDS, CONTENTS_TIERS,
  RENTERS_CLAIMS_FACTORS, RENTERS_DED_LOADING,
  RENTERS_ADDON_LOADING, RENTERS_DISCOUNT_VALUES,
} from "../data/rating-factors/renters.js";

import {
  LIFE_CARRIERS, LIFE_AGE_BANDS, GENDER_FACTORS, SMOKING_FACTORS,
  HEALTH_CLASS_FACTORS, COVERAGE_AMOUNT_BANDS, TERM_MULTIPLIERS,
} from "../data/rating-factors/life.js";

import {
  HEALTH_CARRIERS, HEALTH_AGE_BANDS, FAMILY_FACTORS,
  PRE_EXISTING_FACTORS, PLAN_TIER_FACTORS, PROVINCE_FACTORS,
  HEALTH_DED_FACTORS,
} from "../data/rating-factors/health.js";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface QuoteResult {
  id: string;
  insurerName: string;
  planName: string;
  type: "direct" | "broker";
  overallRating: number;
  reviewCount: number;
  monthlyPremium: number;
  annualPremium: number;
  deductible: number;
  url: string;
  highlights: string[];
  warnings: string[];
  priceScore: number;
  coverageScore: number;
  ratingScore: number;
  baseMatchScore: number;
  telematics?: boolean;
  breakdown: {
    baseRate: number;
    factors: Array<{ name: string; label: string; value: number; impact: string }>;
    coverageLoading: number;
    discountMultiplier: number;
    final: number;
  };
}

export interface AutoInputs {
  postalCode: string;
  vehicleYear?: number;
  vehicleMake: string;
  vehicleType: string;
  vehicleValue: number;
  annualKm: number;
  primaryUse: string;
  driverAge: number;
  yearsLicensed: number;
  atFaultAccidents: number;
  convictions: string;
  liability: number;
  collisionDeductible: number;
  comprehensiveDeductible: number;
  addons?: string[];
  discounts?: string[];
}

export interface HomeInputs {
  region: string;
  dwellingType: string;
  rebuildValue: number;
  homeAge: number;
  heatingType: string;
  claimsCount: number;
  deductible: number;
  addons?: string[];
  discounts?: string[];
}

export interface RentersInputs {
  region: string;
  contentsValue: number;
  claimsCount: number;
  deductible: number;
  addons?: string[];
  discounts?: string[];
}

export interface LifeInputs {
  age: number;
  gender: string;
  smokingStatus: string;
  healthClass: string;
  product: string;
  coverageAmount: number;
}

export interface HealthInputs {
  age: number;
  province: string;
  familySize: string;
  preExisting: string;
  planTier: string;
  deductible: number;
  products: string[];
}

// ─── Static review counts per carrier id ──────────────────────────────────────

const REVIEW_COUNTS: Record<string, number> = {
  SGI: 1840, RATES: 3210, CM: 920, ON: 2140, BD: 4380, WA: 2870,
  SC: 1560, GM: 1230, MW: 890, DJ: 5640, IA: 3120, TD: 7810,
  PB: 740, MN: 4290, EC: 2050, CA: 6130, NB: 580, RS: 1470,
  IN: 8240, TR: 1090, AL: 5370, ZN: 430, ZU: 670, PA: 310,
  AV: 3890, JV: 280, CH: 1620, FA: 190,
  APO: 1340, PME: 2180, SQ1: 3760, KAN: 2890, PM: 650, CO: 4120,
  BL: 1780, TP: 2340, WF: 1450, NV: 520, HSB: 390, LEM: 5490,
  FQ: 1870, SON: 2650, DUO: 1230, SRX: 780, IH: 1560, MT: 2140,
  BLR: 1920, DUN: 2410, EQL: 1680, EL: 2870, GWL: 3140, CL: 4560,
  BMO: 3890, SSQ: 1230, EMP: 890, RBC: 6780, SL: 8920, GS: 4130,
  ABC: 3450, PBC: 2180, MBC: 1670, BEN: 760, ADM: 540, HUM: 430,
  MK: 1890, INS: 340, WDS: 1240, PRE: 280, UNC: 190, HLX: 670,
  NX: 510, SP: 1380, LFT: 290, GRL: 720, CAA: 6130, FCA: 1080,
  AGF: 240, EXL: 390, ACN: 560, GBL: 410, HLF: 680, SYM: 320,
  LBL: 180, MK2: 1890, WDS2: 1240,
};

function getReviewCount(id: string): number {
  return REVIEW_COUNTS[id] ?? Math.round(400 + (id.charCodeAt(0) * 37) % 3000);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function getBandFactor(
  bands: Array<Record<string, number>>,
  value: number,
  key: string,
): number {
  for (const band of bands) {
    if (band[key] !== undefined && value <= band[key]) {
      return band.factor;
    }
  }
  return 1.0;
}

function getCarrierTerritoryFactor(carrierId: string, postalPrefix: string): number {
  const mid =
    (TERRITORY_RANGES as Record<string, { mid: number }>)[postalPrefix]?.mid ??
    TERRITORY_RANGES["other"].mid;
  const offset = ((carrierId.charCodeAt(0) % 7) - 3) * 0.01;
  return mid + offset;
}

function getCarrierMakeFactor(carrierId: string, make: string): number {
  const base = MAKE_FACTORS[make] ?? 1.0;
  const offset = ((carrierId.charCodeAt(1 < carrierId.length ? 1 : 0) % 5) - 2) * 0.01;
  return base + offset;
}

function fmtImpact(value: number): string {
  const pct = ((value - 1) * 100).toFixed(0);
  return `${value >= 1 ? "+" : ""}${pct}%`;
}

function fmtDiscount(multiplier: number): string {
  return `-${((1 - multiplier) * 100).toFixed(0)}%`;
}

function buildHighlightsAuto(inputs: AutoInputs, carrier: { tele?: boolean; name: string }, monthly: number): string[] {
  const bullets: string[] = [];

  if (carrier.tele && inputs.discounts?.includes("telematics")) {
    bullets.push("Telematics discount applied — save up to 10%");
  } else if (carrier.tele) {
    bullets.push("Telematics program available — enroll to save up to 10%");
  }

  if (inputs.convictions === "none") {
    bullets.push("Conviction-free discount applied");
  }

  if (inputs.discounts?.includes("winter_tires")) {
    bullets.push("Winter tires discount applied (4%)");
  }

  if (inputs.discounts?.includes("multi_vehicle")) {
    bullets.push("Multi-vehicle discount applied (7%)");
  }

  if (inputs.discounts?.includes("home_bundle")) {
    bullets.push("Home bundle discount applied (8%)");
  }

  if (inputs.atFaultAccidents === 0 && inputs.convictions === "none") {
    bullets.push("Clean driving record — best available rate tier");
  }

  if (inputs.primaryUse === "pleasure") {
    bullets.push("Pleasure-use vehicle — lower mileage rate applied");
  }

  if (inputs.annualKm <= 12000) {
    bullets.push(`Low annual mileage (${inputs.annualKm.toLocaleString()} km) discount applied`);
  }

  bullets.push(`${carrier.name} — monthly premium $${monthly}`);

  return bullets.slice(0, 3);
}

function buildHighlightsHome(inputs: HomeInputs, carrier: { name: string }, annual: number): string[] {
  const bullets: string[] = [];

  if (inputs.discounts?.includes("auto_bundle")) {
    bullets.push("Auto bundle discount applied — save 10%");
  }
  if (inputs.discounts?.includes("alarm")) {
    bullets.push("Security alarm discount applied (5%)");
  }
  if (inputs.discounts?.includes("claims_free_5yr")) {
    bullets.push("5-year claims-free discount applied (7%)");
  }
  if (inputs.discounts?.includes("new_roof")) {
    bullets.push("New roof discount applied (5%)");
  }
  if (inputs.heatingType === "heat_pump" || inputs.heatingType === "electric") {
    bullets.push("Lower-risk heating system — reduced fire premium");
  }
  if (inputs.claimsCount === 0) {
    bullets.push("No prior claims — preferred rate applied");
  }
  bullets.push(`${carrier.name} — annual premium $${annual.toLocaleString()}`);

  return bullets.slice(0, 3);
}

function buildHighlightsRenters(inputs: RentersInputs, carrier: { name: string }, annual: number): string[] {
  const bullets: string[] = [];

  if (inputs.discounts?.includes("auto_bundle")) {
    bullets.push("Auto bundle discount applied — save 10%");
  }
  if (inputs.discounts?.includes("claims_free")) {
    bullets.push("Claims-free discount applied (7%)");
  }
  if (inputs.discounts?.includes("annual_pay")) {
    bullets.push("Annual payment discount applied (5%)");
  }
  if (inputs.claimsCount === 0) {
    bullets.push("No prior claims — preferred rate applied");
  }
  bullets.push(`${carrier.name} — annual premium $${annual.toLocaleString()}`);

  return bullets.slice(0, 3);
}

function buildHighlightsLife(inputs: LifeInputs, carrier: { name: string }, annual: number): string[] {
  const bullets: string[] = [];

  if (inputs.smokingStatus === "non_smoker") {
    bullets.push("Non-smoker rate — most competitive tier");
  }
  if (inputs.healthClass === "preferred_plus" || inputs.healthClass === "preferred") {
    bullets.push("Preferred health class — discounted rate applied");
  }
  if (inputs.coverageAmount >= 1_000_000) {
    bullets.push("Volume discount applied for $1M+ coverage");
  }
  bullets.push(`${carrier.name} — annual premium $${annual.toLocaleString()}`);
  bullets.push(`${inputs.product.replace(/(\d+)/, " $1-year")} policy — locked-in premium`);

  return bullets.slice(0, 3);
}

function buildHighlightsHealth(inputs: HealthInputs, carrier: { name: string }, monthly: number): string[] {
  const bullets: string[] = [];

  if (inputs.planTier === "enhanced" || inputs.planTier === "premium") {
    bullets.push(`${inputs.planTier.charAt(0).toUpperCase() + inputs.planTier.slice(1)} plan — comprehensive coverage for all selected products`);
  }
  if (inputs.familySize === "family") {
    bullets.push("Family plan — all dependants covered");
  }
  if (inputs.preExisting === "none") {
    bullets.push("No pre-existing conditions — standard rate applied");
  }
  if (inputs.deductible >= 500) {
    bullets.push(`Higher deductible ($${inputs.deductible}) — reduced monthly premium`);
  }
  bullets.push(`${carrier.name} — monthly premium $${monthly}`);

  return bullets.slice(0, 3);
}

function buildWarningsAuto(inputs: AutoInputs): string[] {
  const warnings: string[] = [];

  if (inputs.driverAge < 25) {
    const pct = inputs.driverAge < 21 ? 85 : inputs.driverAge < 25 ? 55 : 25;
    warnings.push(`Young driver surcharge applied (+${pct}%)`);
  }
  if (inputs.atFaultAccidents > 0) {
    warnings.push(`At-fault accident loading applied (${inputs.atFaultAccidents} incident${inputs.atFaultAccidents > 1 ? "s" : ""})`);
  }
  if (inputs.convictions !== "none") {
    warnings.push("Conviction surcharge applied — rate will improve after 3 years");
  }
  if (inputs.primaryUse === "rideshare") {
    warnings.push("Rideshare use surcharge applied (+35%) — verify coverage with carrier");
  }

  return warnings.slice(0, 2);
}

function buildWarningsHome(inputs: HomeInputs): string[] {
  const warnings: string[] = [];

  if (inputs.heatingType === "wood" || inputs.heatingType === "oil") {
    warnings.push(`Higher-risk heating type (${inputs.heatingType}) — fire surcharge applied`);
  }
  if (inputs.claimsCount >= 2) {
    warnings.push(`Prior claims history (${inputs.claimsCount} claims) — rate surcharge applied`);
  }
  if (inputs.homeAge > 40) {
    warnings.push("Older home — age surcharge applied; consider upgrades to reduce premium");
  }

  return warnings.slice(0, 2);
}

function buildWarningsRenters(inputs: RentersInputs): string[] {
  const warnings: string[] = [];

  if (inputs.claimsCount >= 2) {
    warnings.push(`Prior claims history (${inputs.claimsCount} claims) — rate surcharge applied`);
  }

  return warnings.slice(0, 2);
}

function buildWarningsLife(inputs: LifeInputs): string[] {
  const warnings: string[] = [];

  if (inputs.smokingStatus === "smoker") {
    warnings.push("Smoker rate applied (+165%) — rates improve after 12 months smoke-free");
  }
  if (inputs.healthClass === "substandard" || inputs.healthClass === "rated") {
    warnings.push("Substandard health class — medical exam required; rate may be adjusted");
  }
  if (inputs.age > 60) {
    warnings.push("Age surcharge applies; consider shorter term or lower coverage amount");
  }

  return warnings.slice(0, 2);
}

function buildWarningsHealth(inputs: HealthInputs): string[] {
  const warnings: string[] = [];

  if (inputs.preExisting === "major") {
    warnings.push("Major pre-existing conditions — some benefits may have waiting periods");
  }
  if (inputs.age > 60) {
    warnings.push("Age-related surcharge applied; premium reviewed annually");
  }

  return warnings.slice(0, 2);
}

function normalizeScores(quotes: Array<{ monthlyPremium: number; coverageLoadingRaw: number; carrierRating: number } & Partial<QuoteResult>>): void {
  if (quotes.length === 0) return;

  const premiums = quotes.map(q => q.monthlyPremium);
  const minP = Math.min(...premiums);
  const maxP = Math.max(...premiums);
  const range = maxP - minP || 1;

  const loadings = quotes.map(q => q.coverageLoadingRaw);
  const minL = Math.min(...loadings);
  const maxL = Math.max(...loadings);
  const loadRange = maxL - minL || 1;

  for (const q of quotes) {
    q.priceScore    = parseFloat((1 - ((q.monthlyPremium - minP) / range) * 0.9).toFixed(4));
    q.coverageScore = parseFloat(((q.coverageLoadingRaw - minL) / loadRange * 0.8 + 0.2).toFixed(4));
    q.ratingScore   = parseFloat((q.carrierRating / 5).toFixed(4));
    q.baseMatchScore = parseFloat((q.priceScore * 0.4 + q.coverageScore * 0.3 + q.ratingScore * 0.3).toFixed(4));
  }
}

// ─── Auto ─────────────────────────────────────────────────────────────────────

export function calculateAutoQuotes(inputs: AutoInputs): QuoteResult[] {
  const postalPrefix = (inputs.postalCode || "M5V").trim().toUpperCase()[0];

  type Draft = QuoteResult & { coverageLoadingRaw: number; carrierRating: number };

  const drafts: Draft[] = [];
  const deductible = inputs.collisionDeductible ?? 1000;

  AUTO_CARRIERS.forEach((carrier) => {
    const territory  = getCarrierTerritoryFactor(carrier.id, postalPrefix);
    const make       = getCarrierMakeFactor(carrier.id, inputs.vehicleMake.toLowerCase());
    const type       = TYPE_FACTORS[inputs.vehicleType]  ?? 1.0;
    const value      = getBandFactor(VALUE_BANDS,    inputs.vehicleValue,      "maxValue");
    const age        = getBandFactor(AGE_BANDS,      inputs.driverAge,         "maxAge");
    const licensed   = getBandFactor(LICENSED_BANDS, inputs.yearsLicensed,     "maxYears");
    const accident   = ACCIDENT_FACTORS[String(Math.min(inputs.atFaultAccidents, 3))] ?? 1.0;
    const conviction = CONVICTION_FACTORS[inputs.convictions] ?? 1.0;
    const km         = getBandFactor(KM_BANDS,       inputs.annualKm,          "maxKm");
    const use        = USE_FACTORS[inputs.primaryUse] ?? 1.0;

    let coverageLoading = 1.0;
    coverageLoading += LIABILITY_LOADING[String(inputs.liability)] ?? 0;
    coverageLoading += COLLISION_DED_LOADING[String(deductible)] ?? 0;
    coverageLoading += COMP_DED_LOADING[String(inputs.comprehensiveDeductible ?? deductible)] ?? 0;
    for (const addon of (inputs.addons ?? [])) {
      coverageLoading += ADDON_LOADING[addon] ?? 0;
    }
    // Per-carrier coverage tweak so coverageScore spreads (not all 20%)
    const carrierCoverageTweak = 0.02 * ((carrier.id.charCodeAt(0) + (carrier.id.length > 1 ? carrier.id.charCodeAt(1) : 0)) % 7);
    coverageLoading += carrierCoverageTweak;

    let discountTotal = 0;
    for (const d of (inputs.discounts ?? [])) {
      if (d === "telematics" && !carrier.tele) continue;
      discountTotal += DISCOUNT_VALUES[d] ?? 0;
    }
    const discountMultiplier = Math.max(1 - discountTotal, DISCOUNT_FLOOR);

    const monthly = Math.round(
      carrier.baseMonthly
      * territory * make * type * value
      * age * licensed * accident * conviction
      * km * use * coverageLoading * discountMultiplier,
    );

    const breakdown = {
      baseRate: carrier.baseMonthly,
      factors: [
        { name: "territory",  label: `${postalPrefix} postal territory`,    value: territory,          impact: fmtImpact(territory)         },
        { name: "make",       label: `${inputs.vehicleMake} vehicle`,        value: make,               impact: fmtImpact(make)              },
        { name: "type",       label: `${inputs.vehicleType} body type`,      value: type,               impact: fmtImpact(type)              },
        { name: "value",      label: `Vehicle value $${inputs.vehicleValue.toLocaleString()}`, value: value, impact: fmtImpact(value)        },
        { name: "age",        label: `Driver age ${inputs.driverAge}`,        value: age,               impact: fmtImpact(age)               },
        { name: "licensed",   label: `${inputs.yearsLicensed} years licensed`, value: licensed,         impact: fmtImpact(licensed)          },
        { name: "accident",   label: "Accident history",                     value: accident,           impact: fmtImpact(accident)          },
        { name: "conviction", label: "Conviction history",                   value: conviction,         impact: fmtImpact(conviction)        },
        { name: "km",         label: `${inputs.annualKm.toLocaleString()} km/year`, value: km,          impact: fmtImpact(km)                },
        { name: "use",        label: `${inputs.primaryUse} use`,             value: use,               impact: fmtImpact(use)               },
        { name: "coverage",   label: "Coverage selections",                  value: coverageLoading,    impact: fmtImpact(coverageLoading)   },
        { name: "discounts",  label: "Applied discounts",                    value: discountMultiplier, impact: fmtDiscount(discountMultiplier) },
      ],
      coverageLoading,
      discountMultiplier,
      final: monthly,
    };

    drafts.push({
      id: carrier.id,
      insurerName: carrier.name,
      planName: `Standard Auto — ${carrier.name}`,
      type: carrier.type,
      overallRating: carrier.rating,
      reviewCount: getReviewCount(carrier.id),
      monthlyPremium: monthly,
      annualPremium: monthly * 12,
      deductible,
      url: carrier.url,
      highlights: buildHighlightsAuto(inputs, carrier, monthly),
      warnings: buildWarningsAuto(inputs),
      priceScore: 0,
      coverageScore: 0,
      ratingScore: 0,
      baseMatchScore: 0,
      telematics: carrier.tele,
      breakdown,
      coverageLoadingRaw: coverageLoading,
      carrierRating: carrier.rating,
    });
  });

  normalizeScores(drafts);
  drafts.sort((a, b) => a.monthlyPremium - b.monthlyPremium);

  return drafts.map(({ coverageLoadingRaw, carrierRating, ...rest }) => rest);
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export function calculateHomeQuotes(inputs: HomeInputs): QuoteResult[] {
  type Draft = QuoteResult & { coverageLoadingRaw: number; carrierRating: number };
  const drafts: Draft[] = [];
  const deductible = inputs.deductible ?? 1000;

  HOME_CARRIERS.forEach((carrier) => {
    const baseTerritoryMid = HOME_TERRITORY_MIDS[inputs.region] ?? 0.99;
    const territoryOffset  = ((carrier.id.charCodeAt(0) % 9) - 4) * 0.01;
    const territory        = baseTerritoryMid + territoryOffset;

    const dwelling  = DWELLING_FACTORS[inputs.dwellingType]  ?? 1.0;
    const value     = getBandFactor(REBUILD_BANDS,  inputs.rebuildValue, "maxValue");
    const age       = getBandFactor(HOME_AGE_BANDS, inputs.homeAge,      "maxAge");
    const heating   = HEATING_FACTORS[inputs.heatingType]   ?? 1.0;
    const claims    = HOME_CLAIMS_FACTORS[String(Math.min(inputs.claimsCount, 3))] ?? 1.0;

    let coverageLoading = 1.0;
    coverageLoading += HOME_DED_LOADING[String(deductible)] ?? 0;
    for (const addon of (inputs.addons ?? [])) {
      coverageLoading += HOME_ADDON_LOADING[addon] ?? 0;
    }
    const homeCoverageTweak = 0.02 * ((carrier.id.charCodeAt(0) + (carrier.id.length > 1 ? carrier.id.charCodeAt(1) : 0)) % 7);
    coverageLoading += homeCoverageTweak;

    let discountTotal = 0;
    for (const d of (inputs.discounts ?? [])) {
      discountTotal += HOME_DISCOUNT_VALUES[d] ?? 0;
    }
    const discountMultiplier = Math.max(1 - discountTotal, 0.60);

    const annual  = Math.round(
      carrier.baseAnnual
      * territory * dwelling * value * age
      * heating * claims * coverageLoading * discountMultiplier,
    );
    const monthly = Math.round(annual / 12);

    const breakdown = {
      baseRate: carrier.baseAnnual,
      factors: [
        { name: "territory",  label: `${inputs.region} region`,                value: territory,          impact: fmtImpact(territory)          },
        { name: "dwelling",   label: `${inputs.dwellingType} dwelling`,         value: dwelling,           impact: fmtImpact(dwelling)           },
        { name: "value",      label: `Rebuild value $${inputs.rebuildValue.toLocaleString()}`, value: value, impact: fmtImpact(value)            },
        { name: "age",        label: `Home age ${inputs.homeAge} years`,         value: age,               impact: fmtImpact(age)                },
        { name: "heating",    label: `${inputs.heatingType} heating`,            value: heating,           impact: fmtImpact(heating)            },
        { name: "claims",     label: `${inputs.claimsCount} prior claims`,       value: claims,            impact: fmtImpact(claims)             },
        { name: "coverage",   label: "Coverage selections",                     value: coverageLoading,    impact: fmtImpact(coverageLoading)    },
        { name: "discounts",  label: "Applied discounts",                       value: discountMultiplier, impact: fmtDiscount(discountMultiplier) },
      ],
      coverageLoading,
      discountMultiplier,
      final: annual,
    };

    drafts.push({
      id: carrier.id,
      insurerName: carrier.name,
      planName: `Standard Home — ${carrier.name}`,
      type: carrier.type,
      overallRating: carrier.rating,
      reviewCount: getReviewCount(carrier.id),
      monthlyPremium: monthly,
      annualPremium: annual,
      deductible,
      url: carrier.url,
      highlights: buildHighlightsHome(inputs, carrier, annual),
      warnings: buildWarningsHome(inputs),
      priceScore: 0,
      coverageScore: 0,
      ratingScore: 0,
      baseMatchScore: 0,
      breakdown,
      coverageLoadingRaw: coverageLoading,
      carrierRating: carrier.rating,
    });
  });

  normalizeScores(drafts);
  drafts.sort((a, b) => a.annualPremium - b.annualPremium);

  return drafts.map(({ coverageLoadingRaw, carrierRating, ...rest }) => rest);
}

// ─── Renters ──────────────────────────────────────────────────────────────────

export function calculateRentersQuotes(inputs: RentersInputs): QuoteResult[] {
  type Draft = QuoteResult & { coverageLoadingRaw: number; carrierRating: number };
  const drafts: Draft[] = [];

  const contentsTier = CONTENTS_TIERS.find(t => inputs.contentsValue <= t.maxValue)
    ?? CONTENTS_TIERS[CONTENTS_TIERS.length - 1];

  for (const carrier of RENTERS_CARRIERS) {
    const baseTerritoryMid = RENTERS_TERRITORY_MIDS[inputs.region] ?? 0.96;
    const territoryOffset  = ((carrier.id.charCodeAt(0) % 7) - 3) * 0.01;
    const territory        = baseTerritoryMid + territoryOffset;

    const claims = RENTERS_CLAIMS_FACTORS[String(Math.min(inputs.claimsCount, 3))] ?? 1.0;

    let coverageLoading = 1.0;
    coverageLoading += RENTERS_DED_LOADING[String(inputs.deductible)] ?? 0;
    for (const addon of (inputs.addons ?? [])) {
      coverageLoading += RENTERS_ADDON_LOADING[addon] ?? 0;
    }

    let discountTotal = 0;
    for (const d of (inputs.discounts ?? [])) {
      discountTotal += RENTERS_DISCOUNT_VALUES[d] ?? 0;
    }
    const discountMultiplier = Math.max(1 - discountTotal, 0.65);

    const annual  = Math.round(
      carrier.baseAnnual
      * territory * contentsTier.factor
      * claims * coverageLoading * discountMultiplier,
    );
    const monthly = Math.round(annual / 12);

    const breakdown = {
      baseRate: carrier.baseAnnual,
      factors: [
        { name: "territory", label: `${inputs.region} region`,                             value: territory,          impact: fmtImpact(territory)          },
        { name: "contents",  label: `Contents ${contentsTier.label}`,                      value: contentsTier.factor, impact: fmtImpact(contentsTier.factor) },
        { name: "claims",    label: `${inputs.claimsCount} prior claims`,                  value: claims,             impact: fmtImpact(claims)             },
        { name: "coverage",  label: "Coverage selections",                                 value: coverageLoading,    impact: fmtImpact(coverageLoading)    },
        { name: "discounts", label: "Applied discounts",                                   value: discountMultiplier, impact: fmtDiscount(discountMultiplier) },
      ],
      coverageLoading,
      discountMultiplier,
      final: annual,
    };

    drafts.push({
      id: carrier.id,
      insurerName: carrier.name,
      planName: `Standard Renters — ${carrier.name}`,
      type: carrier.type,
      overallRating: carrier.rating,
      reviewCount: getReviewCount(carrier.id),
      monthlyPremium: monthly,
      annualPremium: annual,
      deductible: inputs.deductible,
      url: carrier.url,
      highlights: buildHighlightsRenters(inputs, carrier, annual),
      warnings: buildWarningsRenters(inputs),
      priceScore: 0,
      coverageScore: 0,
      ratingScore: 0,
      baseMatchScore: 0,
      breakdown,
      coverageLoadingRaw: coverageLoading,
      carrierRating: carrier.rating,
    });
  }

  normalizeScores(drafts);
  drafts.sort((a, b) => a.annualPremium - b.annualPremium);

  return drafts.map(({ coverageLoadingRaw, carrierRating, ...rest }) => rest);
}

// ─── Life ─────────────────────────────────────────────────────────────────────

export function calculateLifeQuotes(inputs: LifeInputs): QuoteResult[] {
  type Draft = QuoteResult & { coverageLoadingRaw: number; carrierRating: number };
  const drafts: Draft[] = [];

  for (const carrier of LIFE_CARRIERS) {
    const rates = carrier.baseRates as Record<string, number | undefined>;
    if (!rates[inputs.product]) continue;

    const baseRate      = rates[inputs.product] as number;
    const age           = getBandFactor(LIFE_AGE_BANDS, inputs.age, "maxAge");
    const gender        = GENDER_FACTORS[inputs.gender]        ?? 1.0;
    const smoking       = SMOKING_FACTORS[inputs.smokingStatus] ?? 1.0;
    const health        = HEALTH_CLASS_FACTORS[inputs.healthClass] ?? 1.0;
    const coverageFactor = COVERAGE_AMOUNT_BANDS.find(b => inputs.coverageAmount >= b.minCoverage)?.factor ?? 1.0;
    const coverageUnits  = inputs.coverageAmount / 1_000_000;

    const annual  = Math.round(baseRate * age * gender * smoking * health * coverageFactor * coverageUnits);
    const monthly = Math.round(annual / 12);

    const coverageLoading = age * gender * smoking * health * coverageFactor;

    const breakdown = {
      baseRate,
      factors: [
        { name: "age",      label: `Age ${inputs.age}`,                       value: age,            impact: fmtImpact(age)           },
        { name: "gender",   label: `${inputs.gender} gender factor`,           value: gender,         impact: fmtImpact(gender)        },
        { name: "smoking",  label: `Smoking status: ${inputs.smokingStatus}`,  value: smoking,        impact: fmtImpact(smoking)       },
        { name: "health",   label: `Health class: ${inputs.healthClass}`,      value: health,         impact: fmtImpact(health)        },
        { name: "coverage", label: `$${(inputs.coverageAmount / 1000000).toFixed(1)}M coverage band`, value: coverageFactor, impact: fmtImpact(coverageFactor) },
        { name: "units",    label: `Coverage amount ($${inputs.coverageAmount.toLocaleString()})`,    value: coverageUnits,  impact: `×${coverageUnits.toFixed(2)}` },
      ],
      coverageLoading,
      discountMultiplier: 1.0,
      final: annual,
    };

    const noMed = (carrier as { noMedical?: boolean }).noMedical;

    drafts.push({
      id: carrier.id,
      insurerName: carrier.name,
      planName: `${inputs.product.replace("term", "Term ").replace("whole", "Whole Life").replace("ul", "Universal Life")} — ${carrier.name}`,
      type: carrier.type,
      overallRating: carrier.rating,
      reviewCount: getReviewCount(carrier.id),
      monthlyPremium: monthly,
      annualPremium: annual,
      deductible: 0,
      url: carrier.url,
      highlights: buildHighlightsLife(inputs, carrier, annual),
      warnings: buildWarningsLife(inputs),
      priceScore: 0,
      coverageScore: 0,
      ratingScore: 0,
      baseMatchScore: 0,
      ...(noMed ? { telematics: false } : {}),
      breakdown,
      coverageLoadingRaw: coverageLoading,
      carrierRating: carrier.rating,
    });
  }

  normalizeScores(drafts);
  drafts.sort((a, b) => a.annualPremium - b.annualPremium);

  return drafts.map(({ coverageLoadingRaw, carrierRating, ...rest }) => rest);
}

// ─── Health ───────────────────────────────────────────────────────────────────

export function calculateHealthQuotes(inputs: HealthInputs): QuoteResult[] {
  type Draft = QuoteResult & { coverageLoadingRaw: number; carrierRating: number };
  const drafts: Draft[] = [];

  for (const carrier of HEALTH_CARRIERS) {
    if (!inputs.products.every(p => (carrier.products as readonly string[]).includes(p))) continue;

    const age      = getBandFactor(HEALTH_AGE_BANDS, inputs.age,      "maxAge");
    const family   = FAMILY_FACTORS[inputs.familySize]    ?? 1.0;
    const preEx    = PRE_EXISTING_FACTORS[inputs.preExisting] ?? 1.0;
    const tier     = PLAN_TIER_FACTORS[inputs.planTier]   ?? 1.0;
    const province = PROVINCE_FACTORS[inputs.province]    ?? 1.0;
    const ded      = HEALTH_DED_FACTORS[String(inputs.deductible)] ?? 1.0;

    const rates = carrier.baseRates as Record<string, number | undefined>;
    let totalMonthly = 0;
    for (const product of inputs.products) {
      totalMonthly += (rates[product] ?? 0) * age * family * preEx * tier * province * ded;
    }
    const monthly = Math.round(totalMonthly);
    const annual  = monthly * 12;

    const coverageLoading = age * family * preEx * tier * province * ded;

    const breakdown = {
      baseRate: inputs.products.reduce((s, p) => s + (rates[p] ?? 0), 0),
      factors: [
        { name: "age",      label: `Age ${inputs.age}`,                          value: age,      impact: fmtImpact(age)      },
        { name: "family",   label: `Family size: ${inputs.familySize}`,           value: family,   impact: fmtImpact(family)   },
        { name: "preEx",    label: `Pre-existing: ${inputs.preExisting}`,         value: preEx,    impact: fmtImpact(preEx)    },
        { name: "tier",     label: `Plan tier: ${inputs.planTier}`,               value: tier,     impact: fmtImpact(tier)     },
        { name: "province", label: `Province: ${inputs.province}`,                value: province, impact: fmtImpact(province) },
        { name: "ded",      label: `Deductible $${inputs.deductible}`,            value: ded,      impact: fmtImpact(ded)      },
      ],
      coverageLoading,
      discountMultiplier: 1.0,
      final: monthly,
    };

    drafts.push({
      id: carrier.id,
      insurerName: carrier.name,
      planName: `${inputs.planTier.charAt(0).toUpperCase() + inputs.planTier.slice(1)} Health — ${carrier.name}`,
      type: carrier.type,
      overallRating: carrier.rating,
      reviewCount: getReviewCount(carrier.id),
      monthlyPremium: monthly,
      annualPremium: annual,
      deductible: inputs.deductible,
      url: carrier.url,
      highlights: buildHighlightsHealth(inputs, carrier, monthly),
      warnings: buildWarningsHealth(inputs),
      priceScore: 0,
      coverageScore: 0,
      ratingScore: 0,
      baseMatchScore: 0,
      breakdown,
      coverageLoadingRaw: coverageLoading,
      carrierRating: carrier.rating,
    });
  }

  normalizeScores(drafts);
  drafts.sort((a, b) => a.monthlyPremium - b.monthlyPremium);

  return drafts.map(({ coverageLoadingRaw, carrierRating, ...rest }) => rest);
}

// ─── Summary utility ──────────────────────────────────────────────────────────

export function getQuoteSummary(quotes: QuoteResult[]) {
  return {
    count: quotes.length,
    lowest: quotes[0]?.monthlyPremium ?? 0,
    highest: quotes[quotes.length - 1]?.monthlyPremium ?? 0,
    average: Math.round(quotes.reduce((s, q) => s + q.monthlyPremium, 0) / quotes.length),
    maxSavingsPerYear:
      (quotes[quotes.length - 1]?.annualPremium ?? 0) - (quotes[0]?.annualPremium ?? 0),
  };
}
