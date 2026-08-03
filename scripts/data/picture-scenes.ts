// Scenes for the picture game (note 5e4b20e5), drawn rather than sourced.
//
// The note asks for first-grade-style pictures chosen by the vocabulary. Drawing
// them makes the coordinates exact: the same object definition places the art and
// the hotzone, so a click target can never drift away from the thing it labels —
// which is the failure mode when a photo is captioned by hand.
//
// Every word here already has a chatifai-verified card. Nothing in this file
// introduces new vocabulary; it re-uses what Ariel has already been taught, which
// is also what makes the scene readable to him.
//
// One caveat worth knowing: קַלַם and קַהְוֵה carry ק, and the pending ق ruling
// (scripts/data/qaf-ruling.ts) would rewrite them. Hotzone labels are stored
// separately from cards, so that conversion must sweep this table too.

export type SceneItem = {
  he: string;
  ar: string;
  translit: string;
  /** Where the art is drawn, in canvas units. */
  x: number;
  y: number;
  r: number;
  svg: string;
  /**
   * Click anchor, when it must differ from the drawing anchor.
   *
   * Furniture holds the things on top of it, so a table centred on its own
   * middle swallows the plate and the key sitting there — clicking "שולחן"
   * would land inside the key's target and the learner would be marked wrong
   * for being right. Large objects therefore take their hotzone on a bare part
   * of themselves, usually a leg.
   */
  hx?: number;
  hy?: number;
};

export type Scene = {
  slug: string;
  title: string;
  /** Background drawn before the items. */
  backdrop: string;
  items: SceneItem[];
};

export const W = 800;
export const H = 600;

const C = {
  wall: "#eef2f7",
  floor: "#d9c3a5",
  wood: "#a9784f",
  woodDark: "#8a5f3c",
  white: "#ffffff",
  line: "#3b4453",
  blue: "#5b8def",
  red: "#e2574c",
  green: "#4caf7d",
  yellow: "#f2c14e",
  grey: "#c3cad5",
  dark: "#2f3640",
};

const stroke = `stroke="${C.line}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

/** Wall above, floor below — the same room for every scene. */
const room = (floorY: number) => `
  <rect x="0" y="0" width="${W}" height="${H}" fill="${C.wall}"/>
  <rect x="0" y="${floorY}" width="${W}" height="${H - floorY}" fill="${C.floor}"/>
  <line x1="0" y1="${floorY}" x2="${W}" y2="${floorY}" ${stroke}/>
`;

const door = (x: number, y: number) => `
  <rect x="${x - 45}" y="${y - 85}" width="90" height="170" rx="6" fill="${C.wood}" ${stroke}/>
  <circle cx="${x + 28}" cy="${y}" r="6" fill="${C.yellow}" ${stroke}/>
`;

const window_ = (x: number, y: number) => `
  <rect x="${x - 55}" y="${y - 45}" width="110" height="90" rx="4" fill="#bfe3ff" ${stroke}/>
  <line x1="${x}" y1="${y - 45}" x2="${x}" y2="${y + 45}" ${stroke}/>
  <line x1="${x - 55}" y1="${y}" x2="${x + 55}" y2="${y}" ${stroke}/>
`;

/** `half` is the tabletop half-width; the top surface sits at y - 18. */
const table = (x: number, y: number, half = 90) => `
  <rect x="${x - half}" y="${y - 18}" width="${half * 2}" height="16" rx="4" fill="${C.wood}" ${stroke}/>
  <rect x="${x - half + 12}" y="${y - 2}" width="12" height="60" fill="${C.woodDark}" ${stroke}/>
  <rect x="${x + half - 24}" y="${y - 2}" width="12" height="60" fill="${C.woodDark}" ${stroke}/>
`;

/** Counter running along the back wall. Its top surface is the given y. */
const counter = (y: number) => `
  <rect x="40" y="${y}" width="${W - 80}" height="70" rx="6" fill="${C.woodDark}" ${stroke}/>
  <rect x="40" y="${y}" width="${W - 80}" height="14" rx="4" fill="${C.wood}" ${stroke}/>
`;

const clock = (x: number, y: number) => `
  <circle cx="${x}" cy="${y}" r="30" fill="${C.white}" ${stroke}/>
  <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 18}" ${stroke}/>
  <line x1="${x}" y1="${y}" x2="${x + 13}" y2="${y + 8}" ${stroke}/>
`;

const wardrobe = (x: number, y: number) => `
  <rect x="${x - 55}" y="${y - 95}" width="110" height="190" rx="6" fill="${C.woodDark}" ${stroke}/>
  <line x1="${x}" y1="${y - 95}" x2="${x}" y2="${y + 95}" ${stroke}/>
  <circle cx="${x - 12}" cy="${y}" r="5" fill="${C.yellow}" ${stroke}/>
  <circle cx="${x + 12}" cy="${y}" r="5" fill="${C.yellow}" ${stroke}/>
`;

const key = (x: number, y: number) => `
  <circle cx="${x - 14}" cy="${y}" r="11" fill="none" ${stroke}/>
  <line x1="${x - 4}" y1="${y}" x2="${x + 22}" y2="${y}" ${stroke}/>
  <line x1="${x + 16}" y1="${y}" x2="${x + 16}" y2="${y + 10}" ${stroke}/>
  <line x1="${x + 22}" y1="${y}" x2="${x + 22}" y2="${y + 10}" ${stroke}/>
`;

const book = (x: number, y: number, fill: string) => `
  <rect x="${x - 32}" y="${y - 22}" width="64" height="44" rx="4" fill="${fill}" ${stroke}/>
  <line x1="${x}" y1="${y - 22}" x2="${x}" y2="${y + 22}" ${stroke}/>
`;

// Coloured cover with a spiral: a white lined rectangle is indistinguishable
// from the loose sheet next to it, and the game asks the learner to tell
// דַפְתַר from וַרַקֶה by clicking one of them.
const notebook = (x: number, y: number) => `
  <rect x="${x - 28}" y="${y - 34}" width="56" height="68" rx="4" fill="${C.blue}" ${stroke}/>
  <rect x="${x - 14}" y="${y - 28}" width="36" height="56" rx="2" fill="${C.white}" ${stroke}/>
  <line x1="${x - 6}" y1="${y - 12}" x2="${x + 14}" y2="${y - 12}" stroke="${C.grey}" stroke-width="3"/>
  <line x1="${x - 6}" y1="${y}" x2="${x + 14}" y2="${y}" stroke="${C.grey}" stroke-width="3"/>
  <line x1="${x - 6}" y1="${y + 12}" x2="${x + 14}" y2="${y + 12}" stroke="${C.grey}" stroke-width="3"/>
  ${[-22, -10, 2, 14, 26]
    .map((d) => `<circle cx="${x - 22}" cy="${y + d}" r="3" fill="${C.white}"/>`)
    .join("")}
`;

const pen = (x: number, y: number) => `
  <rect x="${x - 6}" y="${y - 36}" width="12" height="58" rx="3" fill="${C.blue}" ${stroke}/>
  <polygon points="${x - 6},${y + 22} ${x + 6},${y + 22} ${x},${y + 38}" fill="${C.dark}" ${stroke}/>
`;

const board = (x: number, y: number) => `
  <rect x="${x - 130}" y="${y - 75}" width="260" height="150" rx="6" fill="#2e5f4f" ${stroke}/>
  <rect x="${x - 130}" y="${y + 66}" width="260" height="14" rx="4" fill="${C.wood}" ${stroke}/>
`;

const bag = (x: number, y: number) => `
  <rect x="${x - 40}" y="${y - 28}" width="80" height="68" rx="10" fill="${C.red}" ${stroke}/>
  <path d="M ${x - 20} ${y - 28} q 20 -34 40 0" fill="none" ${stroke}/>
`;

const paper = (x: number, y: number) => `
  <rect x="${x - 24}" y="${y - 30}" width="48" height="60" rx="3" fill="${C.white}" ${stroke}/>
  <line x1="${x - 12}" y1="${y - 12}" x2="${x + 12}" y2="${y - 12}" stroke="${C.grey}" stroke-width="3"/>
  <line x1="${x - 12}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="${C.grey}" stroke-width="3"/>
  <line x1="${x - 12}" y1="${y + 12}" x2="${x + 4}" y2="${y + 12}" stroke="${C.grey}" stroke-width="3"/>
`;

const glass = (x: number, y: number) => `
  <path d="M ${x - 18} ${y - 30} L ${x - 13} ${y + 30} L ${x + 13} ${y + 30} L ${x + 18} ${y - 30} Z"
        fill="#cfe9ff" ${stroke}/>
`;

const plate = (x: number, y: number) => `
  <ellipse cx="${x}" cy="${y}" rx="42" ry="16" fill="${C.white}" ${stroke}/>
  <ellipse cx="${x}" cy="${y}" rx="24" ry="8" fill="none" ${stroke}/>
`;

const knife = (x: number, y: number) => `
  <path d="M ${x} ${y - 38} L ${x + 8} ${y - 22} L ${x + 8} ${y + 6} L ${x - 4} ${y + 6} L ${x - 4} ${y - 22} Z"
        fill="${C.grey}" ${stroke}/>
  <rect x="${x - 4}" y="${y + 6}" width="12" height="30" rx="3" fill="${C.dark}" ${stroke}/>
`;

const fork = (x: number, y: number) => `
  <line x1="${x - 10}" y1="${y - 38}" x2="${x - 10}" y2="${y - 14}" ${stroke}/>
  <line x1="${x}" y1="${y - 38}" x2="${x}" y2="${y - 14}" ${stroke}/>
  <line x1="${x + 10}" y1="${y - 38}" x2="${x + 10}" y2="${y - 14}" ${stroke}/>
  <path d="M ${x - 10} ${y - 14} q 10 10 20 0" fill="none" ${stroke}/>
  <rect x="${x - 4}" y="${y - 8}" width="8" height="44" rx="3" fill="${C.grey}" ${stroke}/>
`;

const spoon = (x: number, y: number) => `
  <ellipse cx="${x}" cy="${y - 24}" rx="13" ry="18" fill="${C.grey}" ${stroke}/>
  <rect x="${x - 4}" y="${y - 6}" width="8" height="42" rx="3" fill="${C.grey}" ${stroke}/>
`;

const coffeeCup = (x: number, y: number) => `
  <path d="M ${x - 22} ${y - 18} L ${x - 17} ${y + 20} L ${x + 17} ${y + 20} L ${x + 22} ${y - 18} Z"
        fill="${C.white}" ${stroke}/>
  <path d="M ${x + 22} ${y - 8} q 16 8 0 20" fill="none" ${stroke}/>
  <path d="M ${x - 20} ${y - 14} L ${x + 20} ${y - 14}" stroke="#6f4e37" stroke-width="8"/>
`;

const bread = (x: number, y: number) => `
  <ellipse cx="${x}" cy="${y}" rx="42" ry="26" fill="#e8b96a" ${stroke}/>
  <line x1="${x - 18}" y1="${y - 8}" x2="${x - 8}" y2="${y - 12}" ${stroke}/>
  <line x1="${x + 2}" y1="${y - 10}" x2="${x + 12}" y2="${y - 14}" ${stroke}/>
`;

const pot = (x: number, y: number) => `
  <rect x="${x - 38}" y="${y - 18}" width="76" height="46" rx="6" fill="${C.grey}" ${stroke}/>
  <rect x="${x - 46}" y="${y - 26}" width="92" height="10" rx="4" fill="${C.dark}" ${stroke}/>
  <line x1="${x - 46}" y1="${y - 4}" x2="${x - 58}" y2="${y - 4}" ${stroke}/>
  <line x1="${x + 46}" y1="${y - 4}" x2="${x + 58}" y2="${y - 4}" ${stroke}/>
`;

// Every object rests on a surface. Free-floating art reads as decoration rather
// than as a thing in a room, and in a click-the-object game it also makes the
// hotzone feel arbitrary — so each y below is derived from the surface the item
// sits on, not chosen by eye.
export const SCENES: Scene[] = [
  {
    slug: "room",
    title: "עֻ'רְפֵה — החדר",
    backdrop: room(410),
    items: [
      { he: "דלת", ar: "باب", translit: "בַּאבּ", x: 120, y: 325, r: 0.075, svg: door(120, 325) },
      { he: "חלון", ar: "شباك", translit: "שֻבַּאכּ", x: 330, y: 190, r: 0.075, svg: window_(330, 190) },
      { he: "שולחן", ar: "طاولة", translit: "טַאוְלֶה", x: 350, y: 470, r: 0.06, hx: 258, hy: 505, svg: table(350, 470, 110) },
      { he: "ארון", ar: "خزانة", translit: "חַ'זַאנֵה", x: 650, y: 315, r: 0.08, svg: wardrobe(650, 315) },
      { he: "שעון", ar: "ساعة", translit: "סֵיעַה", x: 540, y: 140, r: 0.055, svg: clock(540, 140) },
      { he: "מפתח", ar: "مفتاح", translit: "מֵפְתַאח", x: 350, y: 442, r: 0.05, svg: key(350, 442) },
    ],
  },
  {
    slug: "classroom",
    title: "צַפּ — הכיתה",
    backdrop: room(430),
    items: [
      { he: "לוח", ar: "لوح", translit: "לוֹח", x: 240, y: 180, r: 0.11, svg: board(240, 180) },
      { he: "דלת", ar: "باب", translit: "בַּאבּ", x: 710, y: 345, r: 0.075, svg: door(710, 345) },
      { he: "שולחן", ar: "طاولة", translit: "טַאוְלֶה", x: 330, y: 490, r: 0.06, hx: 180, hy: 525, svg: table(330, 490, 170) },
      { he: "ספר", ar: "كتاب", translit: "כְּתַאבּ", x: 215, y: 450, r: 0.05, svg: book(215, 450, C.green) },
      { he: "מחברת", ar: "دفتر", translit: "דַפְתַר", x: 310, y: 438, r: 0.05, svg: notebook(310, 438) },
      { he: "דף", ar: "ورقة", translit: "וַרַקֶה", x: 390, y: 442, r: 0.045, svg: paper(390, 442) },
      { he: "עט", ar: "قلم", translit: "קַלַם", x: 450, y: 434, r: 0.045, svg: pen(450, 434) },
      { he: "תיק", ar: "شنطة", translit: "שַנְטַה", x: 620, y: 500, r: 0.07, svg: bag(620, 500) },
      { he: "חלון", ar: "شباك", translit: "שֻבַּאכּ", x: 545, y: 200, r: 0.075, svg: window_(545, 200) },
    ],
  },
  {
    slug: "kitchen",
    title: "מַטְבַּח — המטבח",
    backdrop: room(360) + counter(400),
    items: [
      { he: "קפה", ar: "قهوة", translit: "קַהְוֵה", x: 150, y: 380, r: 0.05, svg: coffeeCup(150, 380) },
      { he: "לחם", ar: "خبز", translit: "חֻ'בֵּז", x: 300, y: 374, r: 0.06, svg: bread(300, 374) },
      { he: "סיר", ar: "طنجرة", translit: "טַנְגַ'רַה", x: 620, y: 372, r: 0.075, svg: pot(620, 372) },
      { he: "חלון", ar: "شباك", translit: "שֻבַּאכּ", x: 450, y: 170, r: 0.075, svg: window_(450, 170) },
      { he: "שולחן", ar: "طاولة", translit: "טַאוְלֶה", x: 400, y: 540, r: 0.06, hx: 208, hy: 575, svg: table(400, 540, 210) },
      { he: "כוס", ar: "كاسة", translit: "כַּאסֶה", x: 250, y: 492, r: 0.05, svg: glass(250, 492) },
      { he: "צלחת", ar: "صحن", translit: "צַחֵן", x: 355, y: 506, r: 0.06, svg: plate(355, 506) },
      { he: "סכין", ar: "سكينة", translit: "סַכִּינֵה", x: 445, y: 486, r: 0.045, svg: knife(445, 486) },
      { he: "מזלג", ar: "شوكة", translit: "שׁוֹכֵּה", x: 500, y: 486, r: 0.045, svg: fork(500, 486) },
      { he: "כף", ar: "معلقة", translit: "מַעְלַאַה", x: 555, y: 486, r: 0.045, svg: spoon(555, 486) },
    ],
  },
];

/** Assembles a scene into a standalone SVG document. */
export function renderScene(scene: Scene): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    scene.backdrop,
    ...scene.items.map((i) => i.svg),
    `</svg>`,
  ].join("\n");
}
