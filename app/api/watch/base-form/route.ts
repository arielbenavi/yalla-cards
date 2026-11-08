import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { isAdminRequest } from "@/lib/auth";
import { fixBet } from "@/lib/word-lookup";
import { madrasa, norm } from "@/lib/dialect-sources";

// A word tapped in a video, as it should become a card: the base form without ל/ה/אל/ו/ב and
// suffixes, with all its forms (m / f / pl for nouns and adjectives; past הוא / present אני for verbs).
// The suggestion is a model's guess, so the sheet shows it editable, next to what Madrasa says.
const schema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    translit: { type: SchemaType.STRING },
    arabic: { type: SchemaType.STRING },
    meaning: { type: SchemaType.STRING },
    seen: { type: SchemaType.STRING },
  },
  required: ["translit", "arabic", "meaning", "seen"],
};

const PROMPT = (word: string, arabic: string, sentence: string, gloss: string) => `A learner of spoken Palestinian Arabic (Jerusalem/Jaffa) tapped a word in a video subtitle.
Word in Hebrew-letter transliteration with nikud: ${word}
Arabic: ${arabic || "(none)"}
Sentence: ${sentence}
Meaning in context: ${gloss || "(unknown)"}

Return the word's dictionary form for a flashcard, in spoken Palestinian (not فصحى):
- Strip the article and attached particles (ال، ل، لل، و، ب، ف) and pronoun suffixes (ـه، ـها، ـنا، ـكم، ـني...).
- Noun: "singular / plural". Adjective or participle: "masculine / feminine / plural". Verb: "past he / present I with ب" (e.g. سوّق / بسوّق).
- A particle or word with one form: just that form.
Fields, all forms joined by " / " in the same order:
- translit: Hebrew letters with full nikud in this app's convention: ض→צ', ص→צ, ظ→ט', ج→ג', خ→ח', غ→ע', ث→ת', ذ→ד', ق mostly א, geresh as ', every ב with dagesh, shadda as dagesh.
- arabic: Arabic script, shadda where doubled, no other vowel marks.
- meaning: Hebrew meanings in the same order, e.g. "מארח / מארחת / מארחים" or "שיווק / (אני) משווק".
- seen: a short Hebrew note on the form in the video, e.g. "בסרטון: לַ(א)לְמֻצִ'יף = למארח". Empty if it is already the base form.`;

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { word, arabic, sentence, gloss } = (await request.json()) as Record<string, string>;
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({
    model: "gemini-3.1-pro-preview",
    generationConfig: { responseMimeType: "application/json", responseSchema: schema },
  });
  try {
    const res = await model.generateContent(PROMPT(word ?? "", arabic ?? "", sentence ?? "", gloss ?? ""));
    const s = JSON.parse(res.response.text()) as { translit: string; arabic: string; meaning: string; seen: string };
    // Madrasa, by the first Hebrew meaning: a second opinion shown next to the guess
    const first = s.meaning.split("/")[0].replace(/\(.*?\)/g, "").trim();
    const entries = first ? await madrasa(first).catch(() => []) : [];
    const ours = s.arabic.split("/").map((x) => norm(x));
    const agrees = entries.length ? entries.some((e) => ours.includes(norm(e.ar))) : null;
    return NextResponse.json({ ...s, translit: fixBet(s.translit), madrasa: { agrees, entries: entries.slice(0, 4) } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
