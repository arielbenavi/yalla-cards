export type NumberEntry = {
  value: number;
  arabic: string;
  translit: string; // Hebrew-script nikud transliteration
};

// Base units 0–10
const UNITS: NumberEntry[] = [
  { value: 0,  arabic: "صفر",     translit: "צִפְר"       },
  { value: 1,  arabic: "واحد",    translit: "וָאחַד"      },
  { value: 2,  arabic: "اثنين",   translit: "אִתְנֵין"    },
  { value: 3,  arabic: "ثلاثة",   translit: "תְלָאתֶה"    },
  { value: 4,  arabic: "أربعة",   translit: "אַרְבַּעָה"  },
  { value: 5,  arabic: "خمسة",    translit: "חַמְסֶה"     },
  { value: 6,  arabic: "ستة",     translit: "סִתֶּה"      },
  { value: 7,  arabic: "سبعة",    translit: "סַבְּעָה"    },
  { value: 8,  arabic: "ثمانية",  translit: "תְמָנְיֶה"   },
  { value: 9,  arabic: "تسعة",    translit: "תִסְעָה"     },
  { value: 10, arabic: "عشرة",    translit: "עַשְׁרָה"    },
];

// Tens 20–100
const TENS: NumberEntry[] = [
  { value: 20,  arabic: "عشرين",  translit: "עִשְׁרִין"   },
  { value: 30,  arabic: "ثلاثين", translit: "תְלָתִין"    },
  { value: 40,  arabic: "أربعين", translit: "אַרְבְּעִין"  },
  { value: 50,  arabic: "خمسين",  translit: "חַמְסִין"    },
  { value: 60,  arabic: "ستين",   translit: "סִתִּין"     },
  { value: 70,  arabic: "سبعين",  translit: "סַבְּעִין"   },
  { value: 80,  arabic: "ثمانين", translit: "תְמָנִין"    },
  { value: 90,  arabic: "تسعين",  translit: "תִסְעִין"    },
  { value: 100, arabic: "مية",    translit: "מִיֵּה"      },
];

// 11–19: عشرة و + unit
function buildTeens(): NumberEntry[] {
  return UNITS.filter((u) => u.value >= 1 && u.value <= 9).map((u) => ({
    value: 10 + u.value,
    arabic: `عشرة و${u.arabic}`,
    translit: `עַשְׁרָה וְ${u.translit}`,
  }));
}

// 21–99 composites: tens + و + unit
function buildComposites(): NumberEntry[] {
  const result: NumberEntry[] = [];
  for (const ten of TENS.slice(0, 8)) { // 20–90 (not 100)
    for (const unit of UNITS.filter((u) => u.value >= 1 && u.value <= 9)) {
      result.push({
        value: ten.value + unit.value,
        arabic: `${ten.arabic} و${unit.arabic}`,
        translit: `${ten.translit} וְ${unit.translit}`,
      });
    }
  }
  return result;
}

// All numbers 0–100, sorted
export const ALL_NUMBERS: NumberEntry[] = [
  ...UNITS,
  ...buildTeens(),
  ...TENS,
  ...buildComposites(),
].sort((a, b) => a.value - b.value);

// Pool definitions per spec order:
// Level 1 — base: 0–10 + round tens (0,10,20,...100)
export const POOL_BASE: NumberEntry[] = ALL_NUMBERS.filter(
  (n) => n.value <= 10 || (n.value > 10 && n.value % 10 === 0)
);
// Level 2 — teens: 11–19
export const POOL_TEENS: NumberEntry[] = ALL_NUMBERS.filter(
  (n) => n.value >= 11 && n.value <= 19
);
// Level 3 — composites: 21–99 (non-round)
export const POOL_COMPOSITES: NumberEntry[] = ALL_NUMBERS.filter(
  (n) => n.value >= 21 && n.value % 10 !== 0
);

export type PoolLevel = "base" | "teens" | "composites" | "all";

export function getPool(level: PoolLevel): NumberEntry[] {
  switch (level) {
    case "base": return POOL_BASE;
    case "teens": return POOL_TEENS;
    case "composites": return POOL_COMPOSITES;
    case "all": return ALL_NUMBERS;
  }
}
