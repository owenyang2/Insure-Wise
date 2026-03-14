export interface MockPolicy {
  id: string;
  insurerName: string;
  insurerLogo: string;
  planName: string;
  monthlyPremium: number;
  annualPremium: number;
  deductible: number;
  baseMatchScore: number;
  priceScore: number;
  coverageScore: number;
  ratingScore: number;
  overallRating: number;
  reviewCount: number;
  highlights: string[];
  warnings: string[];
  coverageMap: Record<string, { status: "covered" | "partial" | "not_covered"; details: string; limit?: string }>;
}

export const AUTO_POLICIES: MockPolicy[] = [
  {
    id: "auto-shield-premium",
    insurerName: "Shield Insurance",
    insurerLogo: "SI",
    planName: "Premium Auto Shield",
    monthlyPremium: 89,
    annualPremium: 1068,
    deductible: 500,
    baseMatchScore: 92,
    priceScore: 78,
    coverageScore: 95,
    ratingScore: 90,
    overallRating: 4.5,
    reviewCount: 12847,
    highlights: ["Rental car coverage included", "Roadside assistance 24/7", "New car replacement up to 3 years", "Accident forgiveness after 5 years"],
    warnings: [],
    coverageMap: {
      "rental car": { status: "covered", details: "Up to $50/day for 30 days", limit: "$50/day" },
      "zero deductible": { status: "not_covered", details: "Standard $500 deductible applies" },
      "flood cover": { status: "covered", details: "Comprehensive coverage includes flood damage" },
      "roadside assistance": { status: "covered", details: "Unlimited roadside assistance included" },
      "uninsured motorist": { status: "covered", details: "UM/UIM coverage up to $100k/$300k" },
      "collision": { status: "covered", details: "Full collision coverage", limit: "Actual cash value" },
      "comprehensive": { status: "covered", details: "Full comprehensive coverage" },
    },
  },
  {
    id: "safeway-basic",
    insurerName: "SafeWay Auto",
    insurerLogo: "SW",
    planName: "Essential Coverage",
    monthlyPremium: 62,
    annualPremium: 744,
    deductible: 1000,
    baseMatchScore: 71,
    priceScore: 92,
    coverageScore: 65,
    ratingScore: 72,
    overallRating: 3.8,
    reviewCount: 8234,
    highlights: ["Lowest premium option", "Online claims processing", "Multi-car discount available"],
    warnings: ["No rental car reimbursement", "Higher deductible", "Limited roadside assistance"],
    coverageMap: {
      "rental car": { status: "not_covered", details: "Rental reimbursement not included in this plan" },
      "zero deductible": { status: "not_covered", details: "$1,000 deductible applies" },
      "flood cover": { status: "partial", details: "Flooding covered under comprehensive, additional premium may apply" },
      "roadside assistance": { status: "partial", details: "Basic towing only, no on-road service" },
      "uninsured motorist": { status: "covered", details: "UM coverage at state minimum" },
      "collision": { status: "covered", details: "Collision coverage included" },
      "comprehensive": { status: "covered", details: "Comprehensive coverage included" },
    },
  },
  {
    id: "alliance-gold",
    insurerName: "Alliance Protection",
    insurerLogo: "AP",
    planName: "Gold Auto Plan",
    monthlyPremium: 105,
    annualPremium: 1260,
    deductible: 250,
    baseMatchScore: 88,
    priceScore: 65,
    coverageScore: 92,
    ratingScore: 95,
    overallRating: 4.7,
    reviewCount: 21563,
    highlights: ["Top-rated claims satisfaction", "Low $250 deductible", "Gap coverage included", "Diminishing deductible program"],
    warnings: ["Higher monthly premium"],
    coverageMap: {
      "rental car": { status: "covered", details: "Up to $75/day unlimited days during repair", limit: "$75/day" },
      "zero deductible": { status: "partial", details: "Diminishing deductible: $0 after 5 years claim-free" },
      "flood cover": { status: "covered", details: "Full comprehensive including flood" },
      "roadside assistance": { status: "covered", details: "Premium roadside: towing, fuel, lockout, battery" },
      "uninsured motorist": { status: "covered", details: "UM/UIM $250k/$500k", limit: "$250k/$500k" },
      "collision": { status: "covered", details: "Full collision with gap coverage" },
      "comprehensive": { status: "covered", details: "Full comprehensive with OEM parts" },
    },
  },
  {
    id: "nationwide-value",
    insurerName: "Nationwide Direct",
    insurerLogo: "ND",
    planName: "Value Auto",
    monthlyPremium: 76,
    annualPremium: 912,
    deductible: 750,
    baseMatchScore: 79,
    priceScore: 85,
    coverageScore: 75,
    ratingScore: 80,
    overallRating: 4.1,
    reviewCount: 15329,
    highlights: ["Usage-based discount available", "Vanishing deductible", "Good student discount"],
    warnings: ["Rental car limited to $35/day"],
    coverageMap: {
      "rental car": { status: "partial", details: "Up to $35/day for 14 days", limit: "$35/day" },
      "zero deductible": { status: "not_covered", details: "$750 deductible standard" },
      "flood cover": { status: "covered", details: "Comprehensive includes natural disasters" },
      "roadside assistance": { status: "covered", details: "24/7 roadside included" },
      "uninsured motorist": { status: "covered", details: "UM/UIM $100k/$300k" },
      "collision": { status: "covered", details: "Standard collision coverage" },
      "comprehensive": { status: "covered", details: "Standard comprehensive" },
    },
  },
  {
    id: "metro-elite",
    insurerName: "Metro Insurance",
    insurerLogo: "MI",
    planName: "Elite Driver Package",
    monthlyPremium: 118,
    annualPremium: 1416,
    deductible: 0,
    baseMatchScore: 85,
    priceScore: 55,
    coverageScore: 98,
    ratingScore: 88,
    overallRating: 4.3,
    reviewCount: 9876,
    highlights: ["ZERO deductible", "Full rental coverage", "New car replacement", "Legal defense included"],
    warnings: ["Premium pricing"],
    coverageMap: {
      "rental car": { status: "covered", details: "Unlimited rental coverage, no daily cap" },
      "zero deductible": { status: "covered", details: "$0 deductible — no out-of-pocket on claims" },
      "flood cover": { status: "covered", details: "All-peril comprehensive coverage" },
      "roadside assistance": { status: "covered", details: "Concierge roadside, hotel stays if stranded" },
      "uninsured motorist": { status: "covered", details: "Full UM/UIM with medical payments", limit: "$500k/$1M" },
      "collision": { status: "covered", details: "Zero-deductible collision" },
      "comprehensive": { status: "covered", details: "Zero-deductible comprehensive" },
    },
  },
];

export const HOME_POLICIES: MockPolicy[] = [
  {
    id: "home-guardian-plus",
    insurerName: "Guardian Home",
    insurerLogo: "GH",
    planName: "Guardian Plus",
    monthlyPremium: 145,
    annualPremium: 1740,
    deductible: 1000,
    baseMatchScore: 90,
    priceScore: 80,
    coverageScore: 92,
    ratingScore: 88,
    overallRating: 4.4,
    reviewCount: 18234,
    highlights: ["Replacement cost coverage", "Water backup included", "Identity theft protection", "Extended liability $500k"],
    warnings: [],
    coverageMap: {
      "flood cover": { status: "not_covered", details: "Flood requires separate NFIP or private flood policy" },
      "water backup": { status: "covered", details: "Sewer/drain backup up to $25k" },
      "replacement cost": { status: "covered", details: "Full replacement cost, no depreciation" },
      "personal liability": { status: "covered", details: "$500k liability coverage" },
      "jewelry": { status: "partial", details: "Up to $2,500 standard, riders available" },
    },
  },
];

export function getPoliciesForType(insuranceType: string): MockPolicy[] {
  switch (insuranceType) {
    case "auto": return AUTO_POLICIES;
    case "home": return HOME_POLICIES;
    default: return AUTO_POLICIES;
  }
}

export function scoreAndRankPolicies(
  policies: MockPolicy[],
  priorities: { price: number; coverage: number; rating: number },
  budgetMonthly: number,
  requirements: string[]
): MockPolicy[] {
  const total = priorities.price + priorities.coverage + priorities.rating || 100;
  const pw = priorities.price / total;
  const cw = priorities.coverage / total;
  const rw = priorities.rating / total;

  return policies
    .map(p => {
      // Budget penalty
      const budgetRatio = Math.min(budgetMonthly / p.monthlyPremium, 1);
      const adjustedPriceScore = p.priceScore * budgetRatio;

      // Requirements coverage boost
      const reqCount = requirements.length;
      let reqScore = 100;
      if (reqCount > 0) {
        const covered = requirements.filter(r => {
          const key = r.toLowerCase();
          const match = Object.entries(p.coverageMap).find(([k]) =>
            key.includes(k) || k.includes(key.split(" ")[0])
          );
          return match && match[1].status === "covered";
        }).length;
        reqScore = (covered / reqCount) * 100;
      }

      const weightedScore = Math.round(
        pw * adjustedPriceScore +
        cw * ((p.coverageScore + reqScore) / 2) +
        rw * p.ratingScore
      );

      return { ...p, baseMatchScore: Math.min(weightedScore, 99) };
    })
    .sort((a, b) => b.baseMatchScore - a.baseMatchScore);
}
