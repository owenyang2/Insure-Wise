export const LIFE_CARRIERS = [
  { id: "BLR",  name: "BestLifeRates",         type: "broker" as const, rating: 4.4, url: "https://www.bestliferates.ca/",                                             baseRates: { term10: 440, term20: 660,  term30: 1010, whole: 7788,  ul: 5676  } },
  { id: "DUN",  name: "Dundas Life",            type: "broker" as const, rating: 4.5, url: "https://dundaslife.com/",                                                   baseRates: { term10: 442, term20: 663,  term30: 1014, whole: 7823,  ul: 5702  } },
  { id: "PME",  name: "Policyme",               type: "direct" as const, rating: 4.4, url: "https://www.policyme.com/life-insurance",                                  baseRates: { term10: 446, term20: 668,  term30: 1022, whole: 7882,  ul: 5745  } },
  { id: "EQL",  name: "Equitable Life",         type: "broker" as const, rating: 4.2, url: "https://www.equitable.ca/personal/insurance/life-insurance/",              baseRates: { term10: 450, term20: 675,  term30: 1033, whole: 7965,  ul: 5805  } },
  { id: "EL",   name: "Empire Life",            type: "broker" as const, rating: 4.1, url: "https://www.empire.ca/life-insurance",                                     baseRates: { term10: 457, term20: 685,  term30: 1048, whole: 8083,  ul: 5891  } },
  { id: "DJ",   name: "Desjardins",             type: "direct" as const, rating: 4.1, url: "https://www.desjardins.com/ca/personal/insurance/life-insurance/",         baseRates: { term10: 463, term20: 695,  term30: 1063, whole: 8201,  ul: 5977  } },
  { id: "MN",   name: "Manulife",               type: "direct" as const, rating: 4.2, url: "https://www.manulife.ca/personal/insurance/life-insurance.html",           baseRates: { term10: 467, term20: 700,  term30: 1071, whole: 8260,  ul: 6020  } },
  { id: "IA",   name: "Industrial Alliance",    type: "direct" as const, rating: 3.9, url: "https://ia.ca/individuals/insurance/life-insurance",                       baseRates: { term10: 473, term20: 710,  term30: 1086, whole: 8378,  ul: 6106  } },
  { id: "CO",   name: "The Co-operators",       type: "direct" as const, rating: 4.2, url: "https://www.cooperators.ca/en/Products/Life-Insurance",                    baseRates: { term10: 478, term20: 717,  term30: 1097, whole: 8461,  ul: 6166  } },
  { id: "SL",   name: "Sun Life",               type: "direct" as const, rating: 4.3, url: "https://www.sunlife.ca/en/insurance/life-insurance/",                      baseRates: { term10: 480, term20: 720,  term30: 1102, whole: 8496,  ul: 6192  } },
  { id: "GWL",  name: "Great-West Life",        type: "broker" as const, rating: 4.1, url: "https://www.gwl.ca/",                                                      baseRates: { term10: 483, term20: 725,  term30: 1109, whole: 8555,  ul: 6235  } },
  { id: "CL",   name: "Canada Life",            type: "broker" as const, rating: 4.1, url: "https://www.canadalife.com/insurance/life-insurance.html",                 baseRates: { term10: 487, term20: 730,  term30: 1117, whole: 8614,  ul: 6278  } },
  { id: "BMO",  name: "BMO Insurance",          type: "direct" as const, rating: 3.9, url: "https://www.bmo.com/main/personal/insurance/life-insurance/",              baseRates: { term10: 493, term20: 740,  term30: 1132, whole: 8732,  ul: 6364  } },
  { id: "SSQ",  name: "SSQ Life",               type: "broker" as const, rating: 4.0, url: "https://www.ssq.ca/en/",                                                   baseRates: { term10: 497, term20: 745,  term30: 1140, whole: 8791,  ul: 6407  } },
  { id: "EMP",  name: "Assumption Life",        type: "broker" as const, rating: 4.0, url: "https://www.assumption.ca/en/life-insurance/",                             baseRates: { term10: 500, term20: 750,  term30: 1148, whole: 8850,  ul: 6450  } },
  { id: "RBC",  name: "RBC Insurance",          type: "direct" as const, rating: 4.0, url: "https://www.rbcinsurance.com/life-insurance/",                             baseRates: { term10: 507, term20: 760,  term30: 1163 }                          },
  { id: "TD",   name: "TD Insurance",           type: "direct" as const, rating: 4.0, url: "https://www.tdinsurance.com/products-services/life-insurance",             baseRates: { term10: 517, term20: 775,  term30: 1186 }                          },
  { id: "SC",   name: "Scoop Insurance",        type: "broker" as const, rating: 4.0, url: "https://www.scoopinsurance.ca/",                                           baseRates: { term10: 520, term20: 780,  term30: 1193 }                          },
  { id: "FIN",  name: "FinancialHelpCenter",    type: "broker" as const, rating: 3.8, url: "https://www.financialhelpcenter.ca/",                                      baseRates: { term10: 523, term20: 785,  term30: 1201 }                          },
  { id: "PRI",  name: "Primerica",              type: "direct" as const, rating: 3.6, url: "https://www.primerica.com/public/",                                        baseRates: { term10: 537, term20: 805,  term30: 1232 }                          },
  { id: "WG",   name: "World Financial Group",  type: "broker" as const, rating: 3.5, url: "https://www.worldfinancialgroup.com/",                                     baseRates: { term10: 543, term20: 815,  term30: 1247 }                          },
  { id: "AXA",  name: "AXA Canada",             type: "broker" as const, rating: 3.9, url: "https://www.axa.ca/",                                                      baseRates: { term10: 547, term20: 820,  term30: 1255 }                          },
  { id: "CON",  name: "Concentra",              type: "broker" as const, rating: 3.8, url: "https://www.concentra.ca/",                                                baseRates: { term10: 550, term20: 825,  term30: 1263 }                          },
  { id: "ACN",  name: "Acasta Life",            type: "direct" as const, rating: 3.7, url: "https://acastalife.com/",                                                  baseRates: { term10: 553, term20: 830,  term30: 1270 }, noMedical: true         },
  { id: "GBL",  name: "Go-to.life",             type: "direct" as const, rating: 3.9, url: "https://go-to.life/",                                                      baseRates: { term10: 557, term20: 835,  term30: 1277 }, noMedical: true         },
  { id: "HLF",  name: "Humania Assurance",      type: "broker" as const, rating: 4.0, url: "https://www.humania.ca/en/life-insurance/",                                baseRates: { term10: 560, term20: 840,  term30: 1285 }, noMedical: true         },
  { id: "SYM",  name: "Symbiosis Insurance",    type: "direct" as const, rating: 3.8, url: "https://www.symbiosisinsurance.ca/",                                       baseRates: { term10: 563, term20: 845,  term30: 1293 }                          },
  { id: "LBL",  name: "Lifetimebenefits",       type: "broker" as const, rating: 3.7, url: "https://www.lifetimebenefits.ca/",                                         baseRates: { term10: 567, term20: 850,  term30: 1301 }                          },
  { id: "PCA",  name: "Pacific Blue Cross",     type: "direct" as const, rating: 4.0, url: "https://www.pac.bluecross.ca/",                                            baseRates: { term10: 570, term20: 855,  term30: 1308 }                          },
  { id: "WDS",  name: "Westland Insurance",     type: "broker" as const, rating: 4.1, url: "https://www.westlandinsurance.ca/",                                        baseRates: { term10: 573, term20: 860,  term30: 1316 }                          },
  { id: "CAA",  name: "CAA Insurance",          type: "direct" as const, rating: 4.2, url: "https://www.caasco.com/insurance/life",                                    baseRates: { term10: 577, term20: 865,  term30: 1323 }                          },
  { id: "GRL",  name: "Green Shield Canada",    type: "direct" as const, rating: 4.1, url: "https://www.greenshield.ca/en/plan-member/life",                           baseRates: { term10: 580, term20: 870,  term30: 1331 }                          },
  { id: "CH",   name: "Chubb Life Canada",      type: "broker" as const, rating: 4.4, url: "https://www.chubblife.com/ca/",                                            baseRates: { term10: 587, term20: 880,  term30: 1346, whole: 10384, ul: 7568  } },
  { id: "MK",   name: "Medavie Blue Cross",     type: "direct" as const, rating: 4.0, url: "https://www.medavie.bluecross.ca/",                                       baseRates: { term10: 590, term20: 885,  term30: 1354 }, noMedical: true         },
  { id: "AGF",  name: "AgriCorp",               type: "broker" as const, rating: 3.6, url: "https://www.agricorp.com/",                                                baseRates: { term10: 593, term20: 890,  term30: 1362 }                          },
  { id: "EXL",  name: "Excellence Life",        type: "direct" as const, rating: 3.8, url: "https://www.excellencelife.ca/",                                           baseRates: { term10: 597, term20: 895,  term30: 1369 }, noMedical: true         },
  { id: "WF",   name: "Western Financial",      type: "broker" as const, rating: 4.0, url: "https://www.westernfinancialgroup.ca/life-insurance",                      baseRates: { term10: 600, term20: 900,  term30: 1377 }                          },
  { id: "FCA",  name: "Foresters Financial",    type: "broker" as const, rating: 3.9, url: "https://www.forestersfinancial.com/ca/",                                   baseRates: { term10: 607, term20: 910,  term30: 1392, whole: 10738, ul: 7826  } },
];

// Source: CIA Canadian Institute of Actuaries mortality tables
export const LIFE_AGE_BANDS = [
  { maxAge: 25, factor: 0.45  },
  { maxAge: 30, factor: 0.60  },
  { maxAge: 35, factor: 1.00  },
  { maxAge: 40, factor: 1.55  },
  { maxAge: 45, factor: 2.30  },
  { maxAge: 50, factor: 3.40  },
  { maxAge: 55, factor: 4.80  },
  { maxAge: 60, factor: 6.80  },
  { maxAge: 65, factor: 9.50  },
  { maxAge: 70, factor: 13.5  },
  { maxAge: 99, factor: 18.0  },
];

export const GENDER_FACTORS: Record<string, number> = {
  male:   1.25,
  female: 1.00,
};

export const SMOKING_FACTORS: Record<string, number> = {
  non_smoker:    1.00,
  cannabis:      1.20,
  former_lt5yr:  1.35,
  smoker:        2.65,
};

export const HEALTH_CLASS_FACTORS: Record<string, number> = {
  preferred_plus: 0.80,
  preferred:      0.90,
  standard_plus:  1.00,
  standard:       1.20,
  substandard:    1.60,
  rated:          2.10,
};

// Ranked by minCoverage descending — first match wins
export const COVERAGE_AMOUNT_BANDS = [
  { minCoverage: 2000000, factor: 0.88 },
  { minCoverage: 1000000, factor: 0.93 },
  { minCoverage: 500000,  factor: 1.00 },
  { minCoverage: 250000,  factor: 1.08 },
  { minCoverage: 0,       factor: 1.18 },
];

export const TERM_MULTIPLIERS: Record<string, number> = {
  term10: 0.67,
  term20: 1.00,
  term30: 1.53,
  whole:  11.8,
  ul:     8.6,
};
