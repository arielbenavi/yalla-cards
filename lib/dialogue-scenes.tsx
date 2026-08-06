/**
 * Scene illustrations for the 15 conversation dialogues.
 *
 * Deferred until all 15 were chatifai-verified — there was no point drawing a
 * scene for text that might still be rewritten. That is now done.
 *
 * These are inline SVG rather than files in the `pictures` bucket. The picture
 * game needs stored images because its hotzones carry coordinates into a
 * specific bitmap; a dialogue header needs no coordinates, so a stored file
 * would only add a signed-URL round trip and a migration for nothing. Inline
 * means they render on first paint with no network at all.
 *
 * Drawn on a 120×90 canvas and scaled by CSS, so the same scene works as a
 * thumbnail in the picker and as a banner above an open dialogue.
 */

const C = {
  sky: "#dbeafe",
  ground: "#e8d9bf",
  wall: "#eef2f7",
  line: "#3b4453",
  wood: "#a9784f",
  red: "#e2574c",
  green: "#4caf7d",
  blue: "#5b8def",
  yellow: "#f2c14e",
  grey: "#c3cad5",
  white: "#ffffff",
  dark: "#2f3640",
  skin: "#f0c8a0",
};

const S = {
  stroke: C.line,
  strokeWidth: 2.5,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

/** Two figures facing each other — the thing every one of these scenes is about. */
function Pair({ x = 60, y = 62 }: { x?: number; y?: number }) {
  return (
    <>
      <circle cx={x - 16} cy={y - 16} r={6} fill={C.skin} {...S} />
      <path d={`M ${x - 24} ${y + 8} q 8 -14 16 0`} fill={C.blue} {...S} />
      <circle cx={x + 16} cy={y - 16} r={6} fill={C.skin} {...S} />
      <path d={`M ${x + 8} ${y + 8} q 8 -14 16 0`} fill={C.red} {...S} />
    </>
  );
}

const Ground = ({ y = 66 }: { y?: number }) => (
  <>
    <rect x="0" y="0" width="120" height="90" fill={C.wall} />
    <rect x="0" y={y} width="120" height={90 - y} fill={C.ground} />
    <line x1="0" y1={y} x2="120" y2={y} {...S} />
  </>
);

const Outdoors = ({ y = 66 }: { y?: number }) => (
  <>
    <rect x="0" y="0" width="120" height="90" fill={C.sky} />
    <rect x="0" y={y} width="120" height={90 - y} fill={C.ground} />
    <line x1="0" y1={y} x2="120" y2={y} {...S} />
  </>
);

const Counter = () => <rect x="10" y="52" width="100" height="14" rx="3" fill={C.wood} {...S} />;

const SCENES: Record<string, React.ReactNode> = {
  shawarma: (
    <>
      <Ground />
      <rect x="14" y="18" width="92" height="14" rx="3" fill={C.red} {...S} />
      <ellipse cx="60" cy="46" rx="11" ry="17" fill="#b5651d" {...S} />
      <Counter />
      <Pair y={80} />
    </>
  ),
  market: (
    <>
      <Outdoors />
      <path d="M 12 26 L 60 12 L 108 26 Z" fill={C.green} {...S} />
      <rect x="16" y="46" width="88" height="20" rx="3" fill={C.wood} {...S} />
      <circle cx="34" cy="42" r="7" fill={C.red} {...S} />
      <circle cx="52" cy="42" r="7" fill={C.yellow} {...S} />
      <circle cx="70" cy="42" r="7" fill={C.green} {...S} />
      <Pair y={80} />
    </>
  ),
  taxi: (
    <>
      <Outdoors />
      <rect x="20" y="40" width="80" height="20" rx="6" fill={C.yellow} {...S} />
      <path d="M 34 40 L 42 28 L 80 28 L 88 40 Z" fill="#cfe9ff" {...S} />
      <rect x="52" y="20" width="18" height="8" rx="2" fill={C.dark} {...S} />
      <circle cx="38" cy="62" r="7" fill={C.dark} {...S} />
      <circle cx="84" cy="62" r="7" fill={C.dark} {...S} />
    </>
  ),
  restaurant: (
    <>
      <Ground />
      <rect x="24" y="46" width="72" height="6" rx="2" fill={C.wood} {...S} />
      <ellipse cx="60" cy="44" rx="16" ry="6" fill={C.white} {...S} />
      <line x1="34" y1="36" x2="34" y2="48" {...S} />
      <line x1="86" y1="36" x2="86" y2="48" {...S} />
      <Pair y={76} />
    </>
  ),
  cafe: (
    <>
      <Ground />
      <path d="M 40 24 L 44 48 L 72 48 L 76 24 Z" fill={C.white} {...S} />
      <path d="M 76 30 q 12 6 0 12" fill="none" {...S} />
      <line x1="42" y1="30" x2="74" y2="30" stroke="#6f4e37" strokeWidth="7" />
      <ellipse cx="58" cy="52" rx="22" ry="4" fill={C.white} {...S} />
      <Counter />
      <Pair y={80} />
    </>
  ),
  bank: (
    <>
      <Ground />
      <path d="M 16 30 L 60 14 L 104 30 Z" fill={C.grey} {...S} />
      <rect x="24" y="30" width="8" height="26" fill={C.white} {...S} />
      <rect x="44" y="30" width="8" height="26" fill={C.white} {...S} />
      <rect x="64" y="30" width="8" height="26" fill={C.white} {...S} />
      <rect x="84" y="30" width="8" height="26" fill={C.white} {...S} />
      <rect x="16" y="56" width="88" height="8" rx="2" fill={C.grey} {...S} />
    </>
  ),
  doctor: (
    <>
      <Ground />
      <rect x="46" y="16" width="28" height="40" rx="4" fill={C.white} {...S} />
      <line x1="60" y1="24" x2="60" y2="48" stroke={C.red} strokeWidth="7" />
      <line x1="50" y1="36" x2="70" y2="36" stroke={C.red} strokeWidth="7" />
      <Pair y={80} />
    </>
  ),
  directions: (
    <>
      <Outdoors />
      <line x1="60" y1="22" x2="60" y2="66" {...S} strokeWidth={4} />
      <path d="M 60 24 L 100 32 L 60 40 Z" fill={C.green} {...S} />
      <path d="M 60 46 L 20 54 L 60 62 Z" fill={C.blue} {...S} />
    </>
  ),
  clothes_shop: (
    <>
      <Ground />
      <line x1="14" y1="26" x2="106" y2="26" {...S} />
      <path d="M 34 30 L 26 38 L 30 56 L 46 56 L 50 38 Z" fill={C.blue} {...S} />
      <path d="M 76 30 L 68 38 L 72 56 L 88 56 L 92 38 Z" fill={C.red} {...S} />
      <Pair y={82} />
    </>
  ),
  gas_station: (
    <>
      <Outdoors />
      <rect x="30" y="26" width="26" height="40" rx="4" fill={C.red} {...S} />
      <rect x="36" y="32" width="14" height="10" rx="2" fill={C.white} {...S} />
      <path d="M 56 36 q 14 0 14 14 L 70 56" fill="none" {...S} />
      <rect x="74" y="44" width="24" height="22" rx="4" fill={C.blue} {...S} />
    </>
  ),
  car_trouble: (
    <>
      <Outdoors />
      <rect x="16" y="42" width="70" height="18" rx="6" fill={C.blue} {...S} />
      <path d="M 30 42 L 38 30 L 68 30 L 76 42 Z" fill="#cfe9ff" {...S} />
      <circle cx="32" cy="62" r="6" fill={C.dark} {...S} />
      <circle cx="72" cy="62" r="6" fill={C.dark} {...S} />
      <circle cx="96" cy="28" r="8" fill="none" stroke={C.dark} strokeWidth="4" />
      <line x1="92" y1="34" x2="80" y2="48" stroke={C.dark} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  family_chat: (
    <>
      <Ground />
      <path d="M 20 34 L 60 14 L 100 34 Z" fill={C.red} {...S} />
      <rect x="28" y="34" width="64" height="32" fill={C.wall} {...S} />
      <circle cx="44" cy="48" r="5" fill={C.skin} {...S} />
      <circle cx="60" cy="48" r="5" fill={C.skin} {...S} />
      <circle cx="76" cy="50" r="4" fill={C.skin} {...S} />
    </>
  ),
  phone_appointment: (
    <>
      <Ground />
      <rect x="40" y="18" width="40" height="48" rx="6" fill={C.dark} {...S} />
      <rect x="46" y="26" width="28" height="30" rx="2" fill="#cfe9ff" {...S} />
      <circle cx="60" cy="61" r="2.5" fill={C.white} />
      <path d="M 22 30 q -8 12 0 24" fill="none" stroke={C.grey} strokeWidth="3" />
      <path d="M 98 30 q 8 12 0 24" fill="none" stroke={C.grey} strokeWidth="3" />
    </>
  ),
  meet_stranger: (
    <>
      <Ground />
      <circle cx="40" cy="30" r="8" fill={C.skin} {...S} />
      <path d="M 26 56 q 14 -20 28 0" fill={C.blue} {...S} />
      <circle cx="80" cy="30" r="8" fill={C.skin} {...S} />
      <path d="M 66 56 q 14 -20 28 0" fill={C.green} {...S} />
      <line x1="52" y1="46" x2="68" y2="46" stroke={C.line} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  self_intro: (
    <>
      <Ground />
      <circle cx="60" cy="30" r="10" fill={C.skin} {...S} />
      <path d="M 42 60 q 18 -24 36 0" fill={C.blue} {...S} />
      <path d="M 78 20 q 16 -6 16 8 q 0 10 -12 10" fill={C.white} {...S} />
      <circle cx="86" cy="42" r="2" fill={C.line} />
    </>
  ),
};

/** Every dialogue key that has a drawing. */
export const DIALOGUE_SCENE_KEYS = Object.keys(SCENES);

export function DialogueScene({ dialogueKey, className }: { dialogueKey: string; className?: string }) {
  const scene = SCENES[dialogueKey];
  if (!scene) return null;
  return (
    <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
      {scene}
    </svg>
  );
}
