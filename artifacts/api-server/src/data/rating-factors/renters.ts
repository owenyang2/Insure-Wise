export const RENTERS_CARRIERS = [
  { id: "LEM",  name: "Lemonade",              type: "direct" as const, rating: 4.5, url: "https://www.lemonade.com/ca/en/renters",                                    baseAnnual: 155 },
  { id: "PME",  name: "Policyme",              type: "direct" as const, rating: 4.4, url: "https://www.policyme.com/renters-insurance",                                baseAnnual: 158 },
  { id: "FQ",   name: "Foxquilt",              type: "direct" as const, rating: 4.2, url: "https://foxquilt.com/renters-insurance/",                                   baseAnnual: 158 },
  { id: "APO",  name: "Apollo Insurance",      type: "broker" as const, rating: 4.3, url: "https://www.apollocover.com/",                                              baseAnnual: 160 },
  { id: "SON",  name: "Sonnet Insurance",      type: "direct" as const, rating: 4.1, url: "https://www.sonnet.ca/renters-insurance",                                   baseAnnual: 162 },
  { id: "RATES",name: "RATESDOTCA",            type: "broker" as const, rating: 4.2, url: "https://www.ratesdotca.ca/renters-insurance/",                              baseAnnual: 163 },
  { id: "DUO",  name: "Duuo",                  type: "direct" as const, rating: 4.0, url: "https://duuo.ca/renters-insurance/",                                        baseAnnual: 165 },
  { id: "KAN",  name: "Kanetix",               type: "broker" as const, rating: 4.0, url: "https://www.kanetix.ca/renters-insurance",                                 baseAnnual: 166 },
  { id: "ON",   name: "Onlia Insurance",       type: "direct" as const, rating: 4.1, url: "https://onlia.ca/renters-insurance/",                                       baseAnnual: 168 },
  { id: "SGI",  name: "SGI Canada",            type: "broker" as const, rating: 4.2, url: "https://www.sgicanada.ca/",                                                 baseAnnual: 170 },
  { id: "SRX",  name: "Surex",                 type: "broker" as const, rating: 4.0, url: "https://www.surex.com/renters-insurance",                                  baseAnnual: 172 },
  { id: "SC",   name: "Scoop Insurance",       type: "broker" as const, rating: 4.0, url: "https://www.scoopinsurance.ca/",                                            baseAnnual: 174 },
  { id: "BD",   name: "Belair Direct",         type: "direct" as const, rating: 3.8, url: "https://www.belairdirect.com/en/renters-insurance/",                        baseAnnual: 175 },
  { id: "IH",   name: "Insurance Hotline",     type: "broker" as const, rating: 3.9, url: "https://www.insurancehotline.com/renters-insurance/",                       baseAnnual: 176 },
  { id: "MT",   name: "Mitch Insurance",       type: "broker" as const, rating: 4.1, url: "https://www.mitch.ca/renters-insurance",                                    baseAnnual: 178 },
  { id: "MW",   name: "Mitchell & Whale",      type: "broker" as const, rating: 4.5, url: "https://www.mitchellandwhale.com/",                                         baseAnnual: 180 },
  { id: "SQ1",  name: "SquareOne Insurance",   type: "direct" as const, rating: 4.5, url: "https://www.squareoneinsurance.ca/renters-insurance/",                      baseAnnual: 180 },
  { id: "TP",   name: "The Personal",          type: "direct" as const, rating: 4.0, url: "https://www.thepersonal.com/insurance/renters-insurance/",                 baseAnnual: 182 },
  { id: "WF",   name: "Western Financial",     type: "broker" as const, rating: 4.0, url: "https://www.westernfinancialgroup.ca/renters-insurance",                   baseAnnual: 183 },
  { id: "WA",   name: "Wawanesa",              type: "broker" as const, rating: 4.3, url: "https://www.wawanesa.com/canada/renters-insurance/",                        baseAnnual: 185 },
  { id: "IA",   name: "Industrial Alliance",   type: "direct" as const, rating: 3.9, url: "https://ia.ca/individuals/insurance/home-insurance",                        baseAnnual: 186 },
  { id: "CO",   name: "The Co-operators",      type: "direct" as const, rating: 4.2, url: "https://www.cooperators.ca/en/Products/Property-Insurance",                 baseAnnual: 187 },
  { id: "BL",   name: "BrokerLink",            type: "broker" as const, rating: 4.0, url: "https://www.brokerlink.ca/renters-insurance",                               baseAnnual: 188 },
  { id: "DJ",   name: "Desjardins",            type: "direct" as const, rating: 4.1, url: "https://www.desjardins.com/ca/personal/insurance/home-insurance/",          baseAnnual: 190 },
  { id: "NB",   name: "Northbridge",           type: "broker" as const, rating: 3.7, url: "https://www.northbridgeinsurance.ca/",                                      baseAnnual: 202 },
  { id: "GM",   name: "Gore Mutual",           type: "broker" as const, rating: 4.1, url: "https://www.goremutual.ca/",                                                baseAnnual: 192 },
  { id: "MN",   name: "Manulife",              type: "direct" as const, rating: 4.0, url: "https://www.manulife.ca/personal/insurance/auto-and-property/home-insurance.html", baseAnnual: 193 },
  { id: "EC",   name: "Economical Insurance",  type: "broker" as const, rating: 3.9, url: "https://www.economical.com/en/personal/home",                               baseAnnual: 195 },
  { id: "PB",   name: "Pembridge Insurance",   type: "broker" as const, rating: 3.9, url: "https://www.pembridge.com/",                                                baseAnnual: 198 },
  { id: "TD",   name: "TD Insurance",          type: "direct" as const, rating: 4.0, url: "https://www.tdinsurance.com/products-services/home-insurance/renters",      baseAnnual: 200 },
  { id: "CA",   name: "CAA Insurance",         type: "direct" as const, rating: 4.2, url: "https://www.caasco.com/insurance/home",                                     baseAnnual: 205 },
  { id: "IN",   name: "Intact Insurance",      type: "broker" as const, rating: 4.2, url: "https://www.intact.net/en/personal-insurance/home-insurance/",              baseAnnual: 210 },
  { id: "AL",   name: "Allstate Canada",       type: "direct" as const, rating: 3.7, url: "https://www.allstate.ca/allstate-insurance/home.aspx",                     baseAnnual: 215 },
  { id: "AV",   name: "Aviva Canada",          type: "broker" as const, rating: 4.1, url: "https://www.aviva.ca/en/insurance/home/",                                   baseAnnual: 220 },
] as const;

export const RENTERS_TERRITORY_MIDS: Record<string, number> = {
  ON_urban: 1.22,
  ON_sub:   1.05,
  ON_rural: 0.85,
  BC_urban: 1.35,
  BC_sub:   1.12,
  AB:       1.10,
  QC:       0.98,
  AT:       0.90,
  other:    0.96,
};

export const CONTENTS_TIERS = [
  { maxValue: 20000,    factor: 0.70, label: "Under $20k"  },
  { maxValue: 50000,    factor: 1.00, label: "$20k–$50k"   },
  { maxValue: 100000,   factor: 1.43, label: "$50k–$100k"  },
  { maxValue: Infinity, factor: 1.97, label: "$100k+"      },
];

export const RENTERS_CLAIMS_FACTORS: Record<string, number> = {
  "0": 1.00,
  "1": 1.18,
  "2": 1.42,
  "3": 1.70,
};

export const RENTERS_DED_LOADING: Record<string, number> = {
  "250":  0.06,
  "500":  0.00,
  "1000": -0.04,
  "2000": -0.08,
};

export const RENTERS_ADDON_LOADING: Record<string, number> = {
  identity_theft: 0.04,
  bike:           0.06,
  electronics:    0.05,
  jewellery:      0.07,
  sewer_backup:   0.05,
  earthquake:     0.10,
  liability_2m:   0.08,
};

export const RENTERS_DISCOUNT_VALUES: Record<string, number> = {
  claims_free:  0.07,
  auto_bundle:  0.10,
  alarm:        0.04,
  non_smoker:   0.03,
  annual_pay:   0.05,
  student:      0.04,
};
