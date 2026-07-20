export type NumberEntry = {
  value: number;
  arabic: string;
  translit: string; // Hebrew-script nikud transliteration
};

// Base units 1–10
const UNITS: NumberEntry[] = [
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
  return UNITS.slice(0, 9).map((u) => ({
    value: 10 + u.value,
    arabic: `عشرة و${u.arabic}`,
    translit: `עַשְׁרָה וְ${u.translit}`,
  }));
}

// 21–99 composites: tens + و + unit
function buildComposites(): NumberEntry[] {
  const result: NumberEntry[] = [];
  for (const ten of TENS.slice(0, 8)) { // 20–90 (not 100)
    for (const unit of UNITS.slice(0, 9)) { // 1–9
      result.push({
        value: ten.value + unit.value,
        arabic: `${ten.arabic} و${unit.arabic}`,
        translit: `${ten.translit} וְ${unit.translit}`,
      });
    }
  }
  return result;
}

// All numbers 1–100, sorted
export const ALL_NUMBERS: NumberEntry[] = [
  ...UNITS,
  ...buildTeens(),
  ...TENS,
  ...buildComposites(),
].sort((a, b) => a.value - b.value);

export const BEGINNER_NUMBERS: NumberEntry[] = ALL_NUMBERS.filter(
  (n) => n.value <= 20
);

export function getPool(difficulty: "beginner" | "advanced"): NumberEntry[] {
  return difficulty === "beginner" ? BEGINNER_NUMBERS : ALL_NUMBERS;
}
