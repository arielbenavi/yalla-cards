import { GoogleGenerativeAI } from "@google/generative-ai";
import { fixBet } from "./word-lookup";

// A social post in Arabic script gets, per word, its transliteration in Hebrew letters with nikud and its
// meaning in context, plus a Hebrew translation of the whole post. All automatic (Gemini), never verified:
// the feed shows it as "משוער". Shared by scripts/feed-seed.ts and the /api/feed/fetch cron.

export type FeedWord = { ar: string; t: string; he: string };
export type Annotated = { translit: string; he: string; words: FeedWord[]; dialect: boolean };

const MODEL = "gemini-3.1-pro-preview";

const PROMPT = `Each item below is a short social-media post, mostly in spoken Palestinian (often Gazan) Arabic.
For each post return {"words","he","dialect"}:
- "words": every Arabic word of the post in order (skip emojis, links, hashtags signs and non-Arabic words; keep numbers only if written in Arabic words), each {"ar": the word exactly as written, "t": the word in Hebrew letters with nikud as an Israeli spoken-Arabic course writes it, as pronounced in Jerusalem colloquial, "he": its meaning here, 1-3 Hebrew words}.
  Letters: ب=בּ ت=ת ث=ת' ج=ג' ح=ח خ=ח' د=ד ذ=ד' ر=ר ز=ז س=ס ش=ש ص=צ ض=צ' ط=ט ظ=ט' ع=ע غ=ע' ف=פ ق=א (colloquial) ك=כּ ل=ל م=מ ن=נ ه=ה و=ו ي=י. a=patach, long a=patach+א, i=hiriq, long i=hiriq+י, e=tsere or segol, u=kubbutz, long u=וּ, long o=וֹ. A doubled letter takes a dagesh. Article: (א)ל before moon letters, (אל) with dagesh before sun letters. Examples: البيت = (א)לְבֵּית · الشغل = (אל)שֻּעֻ'ל · بدي أروح = בִּדִּי אַרוּח · هيك = הֵיכּ · شو = שוּ.
- "he": a natural Hebrew translation of the whole post.
- "dialect": true if the post is mostly colloquial, false if mostly Modern Standard Arabic.
Return only a JSON array, one object per post, same order.`;

const clean = (t: string) => fixBet(t.replace(/ّ/g, "ּ").replace(/[ً-ِْ]/g, "").trim());

export async function annotatePosts(texts: string[], apiKey = process.env.GEMINI_API_KEY!): Promise<Annotated[]> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel(
    { model: MODEL, generationConfig: { responseMimeType: "application/json" } },
    { timeout: 280_000 },
  );
  const res = await model.generateContent(`${PROMPT}\n\n${texts.map((t, i) => `${i + 1}. ${t.replace(/\s+/g, " ")}`).join("\n")}`);
  const raw = res.response.text();
  const out = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1)) as { words: FeedWord[]; he: string; dialect: boolean }[];
  if (out.length !== texts.length) throw new Error(`${out.length} annotations for ${texts.length} posts`);
  return out.map((o) => {
    const words = (o.words ?? []).filter((w) => w.ar && w.t).map((w) => ({ ar: w.ar.trim(), t: clean(w.t), he: (w.he ?? "").trim() }));
    return { words, translit: words.map((w) => w.t).join(" "), he: o.he ?? "", dialect: o.dialect !== false };
  });
}
