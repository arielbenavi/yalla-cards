// Proverbs that are not cards in the deck, added to the deck's own proverbs and expressions
// (/api/proverbs) for the daily proverb. Ariel kept only this one from Madrasa's list (2026-11-07).
export type Proverb = { id: string; ar: string; tr: string; he: string; note?: string };

export const EXTRA_PROVERBS: Proverb[] = [
  { id: "m3", ar: "إطلع فلمك", tr: "אִטְלַע פִלְמַכּ", he: "צא מהסרט", note: "הביטוי קיים אחד לאחד בעברית ובערבית פלשתינאית, אך לא נהוג במדינות אחרות." },
];
