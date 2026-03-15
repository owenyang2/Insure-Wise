export const AUTO_CARRIERS = [
  { id: "SGI",   name: "SGI Canada",          type: "broker" as const, rating: 4.2, tele: false, url: "https://www.sgicanada.ca/",                                                        baseMonthly: 820  },
  { id: "RATES", name: "RATESDOTCA",           type: "broker" as const, rating: 4.2, tele: true,  url: "https://www.ratesdotca.ca/auto-insurance/",                                        baseMonthly: 830  },
  { id: "CM",    name: "Commonwell Mutual",    type: "broker" as const, rating: 4.0, tele: false, url: "https://www.commonwellmutual.com/",                                                baseMonthly: 835  },
  { id: "ON",    name: "Onlia Insurance",      type: "direct" as const, rating: 4.1, tele: true,  url: "https://onlia.ca/auto-insurance/",                                                 baseMonthly: 838  },
  { id: "BD",    name: "Belair Direct",        type: "direct" as const, rating: 3.8, tele: true,  url: "https://www.belairdirect.com/en/auto-insurance/",                                  baseMonthly: 840  },
  { id: "WA",    name: "Wawanesa",             type: "broker" as const, rating: 4.3, tele: false, url: "https://www.wawanesa.com/canada/auto-insurance/",                                  baseMonthly: 845  },
  { id: "SC",    name: "Scoop Insurance",      type: "broker" as const, rating: 4.0, tele: true,  url: "https://www.scoopinsurance.ca/",                                                   baseMonthly: 848  },
  { id: "GM",    name: "Gore Mutual",          type: "broker" as const, rating: 4.1, tele: true,  url: "https://www.goremutual.ca/",                                                       baseMonthly: 850  },
  { id: "MW",    name: "Mitchell & Whale",     type: "broker" as const, rating: 4.5, tele: true,  url: "https://www.mitchellandwhale.com/",                                                baseMonthly: 852  },
  { id: "DJ",    name: "Desjardins",           type: "direct" as const, rating: 4.1, tele: true,  url: "https://www.desjardins.com/ca/personal/insurance/auto-insurance/",                 baseMonthly: 855  },
  { id: "IA",    name: "Industrial Alliance",  type: "direct" as const, rating: 3.9, tele: true,  url: "https://ia.ca/individuals/insurance/auto-insurance",                               baseMonthly: 855  },
  { id: "TD",    name: "TD Insurance",         type: "direct" as const, rating: 4.0, tele: true,  url: "https://www.tdinsurance.com/products-services/auto-car-insurance",                 baseMonthly: 860  },
  { id: "PB",    name: "Pembridge Insurance",  type: "broker" as const, rating: 3.9, tele: false, url: "https://www.pembridge.com/",                                                       baseMonthly: 860  },
  { id: "MN",    name: "Manulife",             type: "direct" as const, rating: 4.0, tele: true,  url: "https://www.manulife.ca/personal/insurance/auto-and-property/auto-insurance.html", baseMonthly: 865  },
  { id: "EC",    name: "Economical Insurance", type: "broker" as const, rating: 3.9, tele: true,  url: "https://www.economical.com/en/personal/auto",                                      baseMonthly: 870  },
  { id: "CA",    name: "CAA Insurance",        type: "direct" as const, rating: 4.2, tele: false, url: "https://www.caasco.com/insurance/auto",                                            baseMonthly: 875  },
  { id: "NB",    name: "Northbridge",          type: "broker" as const, rating: 3.7, tele: false, url: "https://www.northbridgeinsurance.ca/",                                             baseMonthly: 875  },
  { id: "RS",    name: "RSA Canada",           type: "broker" as const, rating: 3.8, tele: false, url: "https://www.rsagroup.ca/",                                                         baseMonthly: 880  },
  { id: "IN",    name: "Intact Insurance",     type: "broker" as const, rating: 4.2, tele: true,  url: "https://www.intact.net/en/personal-insurance/car-insurance/",                      baseMonthly: 885  },
  { id: "TR",    name: "Travelers Canada",     type: "broker" as const, rating: 3.9, tele: false, url: "https://www.travelerscanada.ca/",                                                   baseMonthly: 890  },
  { id: "AL",    name: "Allstate Canada",      type: "direct" as const, rating: 3.7, tele: true,  url: "https://www.allstate.ca/allstate-insurance/auto.aspx",                             baseMonthly: 895  },
  { id: "ZN",    name: "Zenith Insurance",     type: "broker" as const, rating: 3.7, tele: false, url: "https://www.zenithinsurance.ca/",                                                   baseMonthly: 900  },
  { id: "ZU",    name: "Zurich Canada",        type: "broker" as const, rating: 4.0, tele: false, url: "https://www.zurichcanada.com/",                                                     baseMonthly: 905  },
  { id: "PA",    name: "Pafco Insurance",      type: "broker" as const, rating: 3.6, tele: false, url: "https://www.pafco.ca/",                                                             baseMonthly: 910  },
  { id: "AV",    name: "Aviva Canada",         type: "broker" as const, rating: 4.1, tele: true,  url: "https://www.aviva.ca/en/insurance/car/",                                           baseMonthly: 920  },
  { id: "JV",    name: "Jevco Insurance",      type: "broker" as const, rating: 3.5, tele: false, url: "https://www.jevco.ca/",                                                             baseMonthly: 925  },
  { id: "CH",    name: "Chubb Insurance",      type: "broker" as const, rating: 4.4, tele: false, url: "https://www.chubb.com/ca-en/personal-insurance/auto-insurance/",                   baseMonthly: 950  },
  { id: "FA",    name: "Facility Association", type: "broker" as const, rating: 3.3, tele: false, url: "https://www.facilityassociation.com/",                                             baseMonthly: 1100 },
] as const;

// Territory multipliers — per-carrier offsets applied to
// these reference ranges. Source: FSRA Ontario rate filings.
// Each carrier's actual filed multiplier sits within these bands.
// We vary each carrier ±0.03 from the midpoint in the engine.
export const TERRITORY_RANGES = {
  M:     { mid: 1.34, label: "Metro Toronto" },
  L:     { mid: 1.12, label: "Peel/York/Halton" },
  K:     { mid: 0.90, label: "Eastern Ontario" },
  N:     { mid: 1.04, label: "Southwestern Ontario" },
  P:     { mid: 1.01, label: "Northern Ontario" },
  other: { mid: 0.97, label: "Other" },
} as const;

// IBC vehicle symbol tables — repair cost, theft, injury claims
export const MAKE_FACTORS: Record<string, number> = {
  bmw: 1.29, mercedes: 1.28, audi: 1.25, tesla: 1.22,
  volkswagen: 1.03, chevrolet: 1.02, ford: 1.00,
  hyundai: 0.93, kia: 0.92, mazda: 0.91,
  toyota: 0.91, honda: 0.90,
};

export const TYPE_FACTORS: Record<string, number> = {
  ev: 1.12, coupe: 1.08, hybrid: 1.06,
  truck: 1.05, suv: 1.02, sedan: 1.00,
};

// Ranked by max_value ascending — first match wins
export const VALUE_BANDS = [
  { maxValue: 20000,    factor: 0.80 },
  { maxValue: 40000,    factor: 0.92 },
  { maxValue: 70000,    factor: 1.05 },
  { maxValue: 100000,   factor: 1.18 },
  { maxValue: Infinity, factor: 1.32 },
];

// Source: FSRA age rating tables, Ontario loss experience data
export const AGE_BANDS = [
  { maxAge: 20, factor: 1.85 },
  { maxAge: 24, factor: 1.55 },
  { maxAge: 29, factor: 1.25 },
  { maxAge: 39, factor: 1.00 },
  { maxAge: 49, factor: 0.97 },
  { maxAge: 59, factor: 0.95 },
  { maxAge: 69, factor: 0.98 },
  { maxAge: 99, factor: 1.10 },
];

export const LICENSED_BANDS = [
  { maxYears: 1,  factor: 1.35 },
  { maxYears: 4,  factor: 1.18 },
  { maxYears: 9,  factor: 1.08 },
  { maxYears: 14, factor: 1.00 },
  { maxYears: 99, factor: 0.97 },
];

export const ACCIDENT_FACTORS: Record<string, number> = {
  "0": 1.00, "1": 1.40, "2": 1.75, "3": 2.20,
};

export const CONVICTION_FACTORS: Record<string, number> = {
  none: 1.00, minor1: 1.15, minor2: 1.30, major: 1.55,
};

export const KM_BANDS = [
  { maxKm: 8000,  factor: 0.88 },
  { maxKm: 12000, factor: 0.93 },
  { maxKm: 16000, factor: 1.00 },
  { maxKm: 24000, factor: 1.08 },
  { maxKm: 99999, factor: 1.16 },
];

export const USE_FACTORS: Record<string, number> = {
  pleasure: 0.93, commute: 1.00,
  business: 1.18, rideshare: 1.35,
};

export const LIABILITY_LOADING: Record<string, number> = {
  "1000000": 0.00, "2000000": 0.07,
};

export const COLLISION_DED_LOADING: Record<string, number> = {
  "2000": -0.05, "1000": 0.00, "500": 0.08, "250": 0.12,
};

export const COMP_DED_LOADING: Record<string, number> = {
  "2000": -0.03, "1000": 0.00, "500": 0.05, "250": 0.08,
};

export const ADDON_LOADING: Record<string, number> = {
  rental: 0.03, accident_forgiveness: 0.05,
  roadside: 0.02, enhanced_ab: 0.06,
};

export const DISCOUNT_VALUES: Record<string, number> = {
  winter_tires: 0.04, telematics: 0.10,
  multi_vehicle: 0.07, home_bundle: 0.08, alumni_group: 0.05,
};

export const DISCOUNT_FLOOR = 0.65;
