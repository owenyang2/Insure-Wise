export const HEALTH_CARRIERS = [
  {
    id: "SL",  name: "Sun Life",             type: "direct" as const, rating: 4.3,
    url: "https://www.sunlife.ca/en/insurance/health-insurance/",
    products: ["dental", "drugs", "vision", "extended", "critical"],
    baseRates: { dental: 85, drugs: 95, vision: 18, extended: 145, critical: 55 },
  },
  {
    id: "MN",  name: "Manulife",             type: "direct" as const, rating: 4.2,
    url: "https://www.manulife.ca/personal/insurance/health-insurance.html",
    products: ["dental", "drugs", "vision", "extended", "critical"],
    baseRates: { dental: 82, drugs: 91, vision: 17, extended: 140, critical: 52 },
  },
  {
    id: "GS",  name: "Green Shield Canada",  type: "direct" as const, rating: 4.3,
    url: "https://www.greenshield.ca/en/shop",
    products: ["dental", "drugs", "vision", "extended", "critical"],
    baseRates: { dental: 80, drugs: 89, vision: 16, extended: 134, critical: 50 },
  },
  {
    id: "ABC", name: "Alberta Blue Cross",   type: "direct" as const, rating: 4.2,
    url: "https://www.ab.bluecross.ca/individuals-families/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 76, drugs: 85, vision: 15, extended: 128 },
  },
  {
    id: "EQL", name: "Equitable Life",       type: "broker" as const, rating: 4.1,
    url: "https://www.equitable.ca/personal/insurance/health-dental/",
    products: ["dental", "drugs", "vision", "extended", "critical"],
    baseRates: { dental: 77, drugs: 86, vision: 15, extended: 129, critical: 48 },
  },
  {
    id: "PME", name: "Policyme",             type: "direct" as const, rating: 4.4,
    url: "https://www.policyme.com/health-insurance",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 73, drugs: 82, vision: 14, extended: 123 },
  },
  {
    id: "CO",  name: "The Co-operators",     type: "direct" as const, rating: 4.2,
    url: "https://www.cooperators.ca/en/Products/Health-Insurance",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 74, drugs: 83, vision: 14, extended: 125 },
  },
  {
    id: "DJ",  name: "Desjardins",           type: "direct" as const, rating: 4.1,
    url: "https://www.desjardins.com/ca/personal/insurance/health-insurance/",
    products: ["dental", "drugs", "vision", "extended", "critical"],
    baseRates: { dental: 75, drugs: 84, vision: 15, extended: 126, critical: 47 },
  },
  {
    id: "IA",  name: "Industrial Alliance",  type: "direct" as const, rating: 3.9,
    url: "https://ia.ca/individuals/insurance/health-insurance",
    products: ["dental", "drugs", "vision", "extended", "critical"],
    baseRates: { dental: 76, drugs: 85, vision: 15, extended: 127, critical: 46 },
  },
  {
    id: "PBC", name: "Pacific Blue Cross",   type: "direct" as const, rating: 4.1,
    url: "https://www.pac.bluecross.ca/health-insurance/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 74, drugs: 83, vision: 14, extended: 124 },
  },
  {
    id: "MBC", name: "Medavie Blue Cross",   type: "direct" as const, rating: 4.0,
    url: "https://www.medavie.bluecross.ca/health/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 73, drugs: 82, vision: 14, extended: 122 },
  },
  {
    id: "CL",  name: "Canada Life",          type: "broker" as const, rating: 4.1,
    url: "https://www.canadalife.com/insurance/health-and-dental-insurance.html",
    products: ["dental", "drugs", "vision", "extended", "critical"],
    baseRates: { dental: 78, drugs: 87, vision: 16, extended: 131, critical: 49 },
  },
  {
    id: "TD",  name: "TD Insurance",         type: "direct" as const, rating: 4.0,
    url: "https://www.tdinsurance.com/products-services/health-insurance",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 79, drugs: 88, vision: 16, extended: 132 },
  },
  {
    id: "RBC", name: "RBC Insurance",        type: "direct" as const, rating: 4.0,
    url: "https://www.rbcinsurance.com/health-insurance/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 80, drugs: 89, vision: 16, extended: 133 },
  },
  {
    id: "SSQ", name: "SSQ Insurance",        type: "broker" as const, rating: 4.0,
    url: "https://www.ssq.ca/en/health-insurance/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 75, drugs: 84, vision: 15, extended: 126 },
  },
  {
    id: "BEN", name: "Benefits by Design",   type: "broker" as const, rating: 4.1,
    url: "https://www.benefitsbydesign.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 72, drugs: 81, vision: 13, extended: 121 },
  },
  {
    id: "ADM", name: "Chambers of Commerce", type: "broker" as const, rating: 3.9,
    url: "https://www.chamberplan.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 71, drugs: 80, vision: 13, extended: 120 },
  },
  {
    id: "HUM", name: "Humania Assurance",    type: "broker" as const, rating: 4.0,
    url: "https://www.humania.ca/en/health-insurance/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 70, drugs: 79, vision: 13, extended: 118 },
  },
  {
    id: "EMP", name: "Empire Life",          type: "broker" as const, rating: 4.1,
    url: "https://www.empire.ca/health-insurance",
    products: ["dental", "drugs", "vision", "extended", "critical"],
    baseRates: { dental: 76, drugs: 85, vision: 15, extended: 128, critical: 47 },
  },
  {
    id: "CA",  name: "CAA Insurance",        type: "direct" as const, rating: 4.2,
    url: "https://www.caasco.com/insurance/health",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 78, drugs: 87, vision: 15, extended: 130 },
  },
  {
    id: "MK",  name: "Manulife CoverMe",     type: "direct" as const, rating: 4.0,
    url: "https://coverme.manulife.com/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 74, drugs: 83, vision: 14, extended: 124 },
  },
  {
    id: "WF",  name: "Western Financial",    type: "broker" as const, rating: 4.0,
    url: "https://www.westernfinancialgroup.ca/health-insurance",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 73, drugs: 82, vision: 14, extended: 122 },
  },
  {
    id: "BL",  name: "BrokerLink",           type: "broker" as const, rating: 4.0,
    url: "https://www.brokerlink.ca/health-insurance",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 72, drugs: 81, vision: 13, extended: 121 },
  },
  {
    id: "IH",  name: "Imagine Health",       type: "direct" as const, rating: 4.0,
    url: "https://www.imaginehealth.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 71, drugs: 80, vision: 13, extended: 119 },
  },
  {
    id: "NX",  name: "Nexgen Benefits",      type: "broker" as const, rating: 3.9,
    url: "https://www.nexgenbenefits.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 70, drugs: 79, vision: 12, extended: 118 },
  },
  {
    id: "SP",  name: "Simply Benefits",      type: "direct" as const, rating: 4.1,
    url: "https://www.simplybenefits.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 69, drugs: 78, vision: 12, extended: 116 },
  },
  {
    id: "LFT", name: "Lifetimebenefits",     type: "broker" as const, rating: 3.8,
    url: "https://www.lifetimebenefits.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 71, drugs: 80, vision: 13, extended: 119 },
  },
  {
    id: "INS", name: "insly",                type: "broker" as const, rating: 3.7,
    url: "https://insly.com/",
    products: ["dental", "drugs"],
    baseRates: { dental: 68, drugs: 77 },
  },
  {
    id: "WDS", name: "Westland Insurance",   type: "broker" as const, rating: 4.1,
    url: "https://www.westlandinsurance.ca/health-insurance",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 72, drugs: 81, vision: 13, extended: 121 },
  },
  {
    id: "PRE", name: "Prestige Health",      type: "broker" as const, rating: 3.8,
    url: "https://www.prestigehealth.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 73, drugs: 82, vision: 14, extended: 122 },
  },
  {
    id: "UNC", name: "Union Benefits",       type: "broker" as const, rating: 3.9,
    url: "https://www.unionbenefits.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 70, drugs: 79, vision: 13, extended: 118 },
  },
  {
    id: "HLX", name: "HealthQuotes",         type: "broker" as const, rating: 4.0,
    url: "https://www.healthquotes.ca/",
    products: ["dental", "drugs", "vision", "extended"],
    baseRates: { dental: 71, drugs: 80, vision: 13, extended: 119 },
  },
];

export const HEALTH_AGE_BANDS = [
  { maxAge: 25, factor: 0.78 },
  { maxAge: 30, factor: 0.88 },
  { maxAge: 35, factor: 1.00 },
  { maxAge: 40, factor: 1.14 },
  { maxAge: 45, factor: 1.30 },
  { maxAge: 50, factor: 1.50 },
  { maxAge: 55, factor: 1.74 },
  { maxAge: 60, factor: 2.02 },
  { maxAge: 65, factor: 2.35 },
  { maxAge: 99, factor: 2.80 },
];

export const FAMILY_FACTORS: Record<string, number> = {
  single:        1.00,
  couple:        1.72,
  single_parent: 1.65,
  family:        2.20,
};

export const PRE_EXISTING_FACTORS: Record<string, number> = {
  none:     1.00,
  minor:    1.15,
  moderate: 1.38,
  major:    1.75,
};

export const PLAN_TIER_FACTORS: Record<string, number> = {
  basic:    0.70,
  standard: 1.00,
  enhanced: 1.35,
  premium:  1.75,
};

export const PROVINCE_FACTORS: Record<string, number> = {
  BC:    1.10,
  AB:    1.08,
  ON:    1.05,
  QC:    0.95,
  AT:    0.90,
  other: 1.00,
};

export const HEALTH_DED_FACTORS: Record<string, number> = {
  "0":    1.00,
  "100":  0.94,
  "250":  0.88,
  "500":  0.81,
  "1000": 0.72,
};
