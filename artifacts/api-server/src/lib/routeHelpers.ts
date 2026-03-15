import type { QuoteResult } from "./quoteEngine.js";

// ─── Location helpers ─────────────────────────────────────────────────────────

/** Infer a home/renters region key from a free-text location string */
export function inferRegion(location: string): string {
  const l = location.toLowerCase();
  if (/toronto|scarborough|north york|etobicoke|\bm\d/i.test(l)) return "ON_urban";
  if (/mississauga|brampton|vaughan|markham|richmond hill|\bl\d/i.test(l)) return "ON_sub";
  if (/ottawa|kingston|\bk\d/i.test(l)) return "ON_rural";
  if (/london|windsor|kitchener|waterloo|hamilton|\bn\d/i.test(l)) return "ON_sub";
  if (/sudbury|thunder bay|sault|\bp\d/i.test(l)) return "ON_rural";
  if (/vancouver|surrey|burnaby|richmond|\bv\d/i.test(l)) return "BC_urban";
  if (/victoria|kelowna|abbotsford/i.test(l)) return "BC_sub";
  if (/alberta|calgary|edmonton|\bt\d/i.test(l)) return "AB";
  if (/quebec|montreal|laval|\bh\d/i.test(l)) return "QC";
  if (/new brunswick|nova scotia|pei|newfoundland|atlantic|\be\d|\bb\d|\bc\d|\ba\d/i.test(l)) return "AT";
  return "ON_sub";
}

/** Extract health/life province from a free-text location string */
export function inferProvince(location: string): string {
  const l = location.toLowerCase();
  if (/ontario|toronto|ottawa|\bon\b/i.test(l)) return "ON";
  if (/british columbia|vancouver|\bbc\b/i.test(l)) return "BC";
  if (/alberta|calgary|edmonton|\bab\b/i.test(l)) return "AB";
  if (/quebec|montreal|\bqc\b/i.test(l)) return "QC";
  if (/atlantic|nova scotia|new brunswick|pei|newfoundland/i.test(l)) return "AT";
  return "ON";
}

/** Extract a Canadian FSA (first 3 chars of postal code) from a location string */
export function extractPostalPrefix(location: string): string {
  const m = location.match(/\b([A-Za-z]\d[A-Za-z])\b/);
  if (m) return m[1].toUpperCase()[0];
  const l = location.toLowerCase();
  if (/toronto|scarborough|north york|etobicoke/i.test(l)) return "M";
  if (/mississauga|brampton|vaughan|markham/i.test(l)) return "L";
  if (/ottawa|kingston/i.test(l)) return "K";
  if (/london|windsor|kitchener|waterloo|hamilton/i.test(l)) return "N";
  if (/sudbury|thunder bay/i.test(l)) return "P";
  if (/vancouver|surrey|burnaby/i.test(l)) return "V";
  if (/calgary|edmonton/i.test(l)) return "T";
  if (/montreal|laval/i.test(l)) return "H";
  return location.trim()[0]?.toUpperCase() ?? "M";
}

// ─── Coverage helpers ─────────────────────────────────────────────────────────

/** Standard coverage items per insurance type — used for coverageSummary and gapCount */
const STANDARD_COVERAGE: Record<string, string[]> = {
  auto:    ["liability", "accident benefits", "uninsured motorist", "collision", "comprehensive"],
  home:    ["dwelling", "contents", "personal liability", "additional living expenses", "detached structures"],
  renters: ["contents", "personal liability", "additional living expenses", "loss of use"],
  life:    ["death benefit", "terminal illness", "conversion option"],
  health:  ["dental", "drugs", "vision", "extended health", "paramedical"],
};

/** Build a readable coverageSummary array from a QuoteResult */
export function buildCoverageSummary(insuranceType: string, q: QuoteResult) {
  const standards: Record<string, Array<{ type: string; name: string; status: string; details: string; limit?: string }>> = {
    auto: [
      { type: "liability",          name: "Third-Party Liability",  status: "covered", details: "Up to $2,000,000 per occurrence",   limit: "$2,000,000" },
      { type: "accident_benefits",  name: "Accident Benefits",      status: "covered", details: "Ontario statutory accident benefits"               },
      { type: "uninsured_motorist", name: "Uninsured Motorist",     status: "covered", details: "Coverage against uninsured drivers"                },
      { type: "collision",          name: "Collision",              status: "covered", details: `$${q.deductible} deductible`,        limit: "ACV"        },
      { type: "comprehensive",      name: "Comprehensive",          status: "covered", details: "Theft, weather, fire, vandalism",    limit: "ACV"        },
    ],
    home: [
      { type: "dwelling",           name: "Dwelling",               status: "covered", details: "Replacement cost coverage"                          },
      { type: "contents",           name: "Personal Property",      status: "covered", details: "Contents replacement cost"                          },
      { type: "liability",          name: "Personal Liability",     status: "covered", details: "$1,000,000 personal liability",      limit: "$1,000,000" },
      { type: "living_expenses",    name: "Additional Living",      status: "covered", details: "Up to 24 months if home uninhabitable"              },
      { type: "detached_structures",name: "Detached Structures",    status: "covered", details: "Garage, shed, fence coverage"                       },
    ],
    renters: [
      { type: "contents",           name: "Personal Property",      status: "covered", details: "Contents replacement cost"                          },
      { type: "liability",          name: "Personal Liability",     status: "covered", details: "$1,000,000 personal liability",      limit: "$1,000,000" },
      { type: "living_expenses",    name: "Additional Living",      status: "covered", details: "Temporary housing if unit uninhabitable"            },
      { type: "loss_of_use",        name: "Loss of Use",            status: "covered", details: "Living costs while displaced"                       },
    ],
    life: [
      { type: "death_benefit",      name: "Death Benefit",          status: "covered", details: "Lump-sum payment to beneficiary"                   },
      { type: "terminal_illness",   name: "Terminal Illness",       status: "covered", details: "Advance payment on terminal diagnosis"              },
      { type: "conversion",         name: "Conversion Option",      status: "covered", details: "Convert to permanent coverage without medical exam" },
    ],
    health: [
      { type: "dental",             name: "Dental Care",            status: "covered", details: "Preventive, basic, and major dental"                },
      { type: "drugs",              name: "Prescription Drugs",     status: "covered", details: "Formulary drug coverage"                            },
      { type: "vision",             name: "Vision Care",            status: "covered", details: "Glasses, contacts, eye exams"                       },
      { type: "paramedical",        name: "Paramedical",            status: "covered", details: "Physio, massage, chiro, psychologist"               },
    ],
  };
  return (standards[insuranceType] ?? standards["auto"]).slice(0, 5);
}

/** Count requirements not covered by the standard coverage list for this type */
export function computeGapCount(requirements: string[], insuranceType: string): number {
  const standard = STANDARD_COVERAGE[insuranceType] ?? STANDARD_COVERAGE["auto"];
  let gaps = 0;
  for (const req of requirements) {
    const r = req.toLowerCase().trim();
    const covered = standard.some(s => r.includes(s) || s.includes(r));
    if (!covered) gaps++;
  }
  return gaps;
}

// ─── Pricing helpers ──────────────────────────────────────────────────────────

/** Compute a ±15% savings band, ensuring min >= 1 */
export function savingsBand(saving: number, spreadLow = 0.85, spreadHigh = 1.15): [number, number] {
  return [Math.max(1, Math.round(saving * spreadLow)), Math.round(saving * spreadHigh)];
}

export function impactLevel(monthly: number, threshHigh = 20, threshMed = 8): "high" | "medium" | "low" {
  return monthly >= threshHigh ? "high" : monthly >= threshMed ? "medium" : "low";
}

// ─── Dec-page extraction helpers ─────────────────────────────────────────────

export interface DecPageFields {
  first_name: string | null;
  last_name: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vin: string | null;
  annual_mileage: string | null;
  primary_use: "commute" | "pleasure" | "business" | "farm" | null;
  deductible: string | null;
  monthly_premium: string | null;
  current_carrier: string | null;
  location: string | null;
}

/** Parses and validates raw Claude response text into DecPageFields.
 *  Strips markdown fences, returns null for any field that is missing or
 *  not a string/null — never throws. */
export function parseDecPageResponse(rawText: string): DecPageFields {
  const clean = rawText.replace(/```json|```/g, "").trim();
  let parsed: Record<string, unknown>;
  try {
    const candidate = JSON.parse(clean);
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      return emptyDecFields();
    }
    parsed = candidate as Record<string, unknown>;
  } catch {
    return emptyDecFields();
  }
  const validUses = new Set(["commute", "pleasure", "business", "farm"]);
  return {
    first_name:      toStringOrNull(parsed.first_name),
    last_name:       toStringOrNull(parsed.last_name),
    vehicle_make:    toStringOrNull(parsed.vehicle_make),
    vehicle_model:   toStringOrNull(parsed.vehicle_model),
    vehicle_year:    toStringOrNull(parsed.vehicle_year),
    vin:             toStringOrNull(parsed.vin),
    annual_mileage:  toStringOrNull(parsed.annual_mileage),
    primary_use:     validUses.has(parsed.primary_use as string)
                       ? (parsed.primary_use as DecPageFields["primary_use"])
                       : null,
    deductible:      toStringOrNull(parsed.deductible),
    monthly_premium: toStringOrNull(parsed.monthly_premium),
    current_carrier: toStringOrNull(parsed.current_carrier),
    location:        toStringOrNull(parsed.location),
  };
}

function toStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function emptyDecFields(): DecPageFields {
  return {
    first_name: null, last_name: null, vehicle_make: null, vehicle_model: null,
    vehicle_year: null, vin: null, annual_mileage: null, primary_use: null,
    deductible: null, monthly_premium: null, current_carrier: null, location: null,
  };
}
