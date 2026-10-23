// Sanity cases for lib/translation-match.ts. Read only.
//   npx tsx scripts/check-translation-match.ts
import { matchAnswer } from "../lib/translation-match";

const cases: [string, string, "ar" | "he", boolean][] = [
  ["האדא מלג'א ביתנא והו זעיר וקדים", "הַאדַא מַלְגַ'א בֵּיתְנַא וְהֻוֵּ זְעִ'יר וְקַדִים", "ar", true],
  ["האדא מלגא ביתנא והוה זעיר וקדים", "הַאדַא מַלְגַ'א בֵּיתְנַא וְהֻוֵּ זְעִ'יר וְקַדִים", "ar", true],
  ["מכתבת אלמדינה כבירה וג'דידה", "מַכְּתַבְּתִ (א)לְמַדִינֵה כְּבִּירֵה וְגְ'דִידֵה", "ar", true],
  ["האדא מסגד", "הַאדַא מַלְגַ'א בֵּיתְנַא וְהֻוֵּ זְעִ'יר וְקַדִים", "ar", false],
  ["יתן לך בריאות", "(אלוהים) יתן לך בריאות (תודה רבה).", "he", true],
  ["זה חדר הילד", "זה חדר הילד.", "he", true],
  ["זה מטבח הבית", "זה חדר הילד.", "he", false],
  ["זאת מזוודתך", "ואתה יא אחמד, זאת מזוודתך/תיקך?", "he", false],
];
let bad = 0;
for (const [typed, ans, lang, want] of cases) {
  const r = matchAnswer(typed, ans, lang);
  const ok = r.pass === want;
  if (!ok) bad++;
  console.log(ok ? "✅" : "❌", Math.round(r.score * 100) + "%", typed);
}
process.exit(bad ? 1 : 0);
