import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

export type ParsedCard = {
  hebrew_meaning: string;
  translit_nikud: string;
  item_type: "word" | "phrase" | "sentence";
  confidence: "low" | "high";
  notes: string;
};

export type ParsedWhatsAppCard = ParsedCard & { source_index: number };

const CORE_RULES = `For each item, produce:
- hebrew_meaning: the Hebrew meaning/translation, cleaned up.
- translit_nikud: the Hebrew-letter transliteration WITH nikkud. Input may already have full nikkud,
  partial/missing nikkud, or be plain Hebrew letters or Latin letters with no nikkud at all (e.g.
  "ya jari inta fi darak"). In every case, output translit_nikud as Hebrew script with standard
  nikkud inferred for urban Levantine Arabic conventions. If you had to infer or guess any nikkud
  (because it was missing, partial, or the input was in Latin letters), set confidence to "low".
  If the input already had clear, complete nikkud, set confidence to "high".
- item_type: "word" for a single word, "phrase" for a short expression, "sentence" for a full sentence.
- confidence: "low" if you had to guess/infer anything (nikkud, illegible handwriting, ambiguous
  meaning), otherwise "high".
- notes: any usage notes, context, or literal-vs-idiomatic distinction worth keeping (e.g. "used
  when addressing a man" or "literally: my neighbor"). Empty string "" if there's nothing to add.`;

const responseSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      hebrew_meaning: { type: SchemaType.STRING },
      translit_nikud: { type: SchemaType.STRING },
      item_type: { type: SchemaType.STRING, format: "enum", enum: ["word", "phrase", "sentence"] },
      confidence: { type: SchemaType.STRING, format: "enum", enum: ["low", "high"] },
      notes: { type: SchemaType.STRING },
    },
    required: ["hebrew_meaning", "translit_nikud", "item_type", "confidence", "notes"],
  },
};

const whatsappResponseSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      hebrew_meaning: { type: SchemaType.STRING },
      translit_nikud: { type: SchemaType.STRING },
      item_type: { type: SchemaType.STRING, format: "enum", enum: ["word", "phrase", "sentence"] },
      confidence: { type: SchemaType.STRING, format: "enum", enum: ["low", "high"] },
      notes: { type: SchemaType.STRING },
      source_index: { type: SchemaType.INTEGER },
    },
    required: ["hebrew_meaning", "translit_nikud", "item_type", "confidence", "notes", "source_index"],
  },
};

const SYSTEM_PROMPT = `You parse notes for a Palestinian Arabic (Jerusalem/Jaffa dialect) vocabulary app.
Input is either pasted lesson notes or a photo of a handwritten notebook page. Each line typically
has the format "transliteration — Hebrew meaning" (transliteration is Hebrew script, representing
spoken Arabic; the dash may be "-", "–", "—", or missing).

${CORE_RULES}

Return ONLY the JSON array, no prose. If a line is unreadable or not a vocabulary item, skip it.`;

const WHATSAPP_SYSTEM_PROMPT = `You parse a WhatsApp chat export from a Palestinian Arabic
(Jerusalem/Jaffa dialect) teacher into vocabulary cards. You are given a numbered list of the
teacher's text messages, each prefixed with its index like "[3] message text". A single message
often contains one vocabulary item laid out across a few lines in this order: (1) the Arabic phrase
written as Hebrew transliteration, (2) a literal word-for-word translation, (3) the everyday
meaning or usage explanation. A message can also contain zero or multiple items.

Some messages are daily-proverb items in this exact labeled format:
  "פתגם יומי: / <translit with nikkud> / תרגום מילולי: <literal translation> / משמעות: <meaning/usage>"
(the "שימוש:" label is used interchangeably with "משמעות:"). For these:
- hebrew_meaning = the תרגום מילולי (literal translation) text ONLY, with the label stripped.
- notes = the משמעות/שימוש (meaning/usage) text ONLY, with the label stripped. Do not put the
  literal translation in notes and do not put the meaning/usage in hebrew_meaning -- they are
  swapped from what you might expect at first glance.

${CORE_RULES}
- notes: for non-proverb messages, capture the literal translation and any usage explanation here
  (not just a copy of hebrew_meaning). Empty string "" if the message had nothing beyond the
  meaning itself.
- source_index: the index number (the "[N]") of the message this item came from.

Return ONLY the JSON array, no prose. Skip messages that aren't vocabulary teaching content
(greetings, logistics, etc).`;

function getModel(schema: Schema) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
}

export async function parseLessonText(text: string): Promise<ParsedCard[]> {
  const model = getModel(responseSchema);
  const result = await model.generateContent([SYSTEM_PROMPT, `Lesson notes:\n${text}`]);
  return JSON.parse(result.response.text());
}

export async function parseLessonImages(
  images: { mimeType: string; base64: string }[]
): Promise<ParsedCard[]> {
  const model = getModel(responseSchema);
  const parts = [
    SYSTEM_PROMPT,
    ...images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.base64 },
    })),
  ];
  const result = await model.generateContent(parts);
  return JSON.parse(result.response.text());
}

export async function parseWhatsAppMessages(
  messages: { index: number; text: string }[]
): Promise<ParsedWhatsAppCard[]> {
  const model = getModel(whatsappResponseSchema);
  const numbered = messages.map((m) => `[${m.index}] ${m.text}`).join("\n\n");
  const result = await model.generateContent([WHATSAPP_SYSTEM_PROMPT, `Messages:\n${numbered}`]);
  return JSON.parse(result.response.text());
}

export type PdfExtractedItem = {
  item_number: number | null;
  translit_nikud: string;
  hebrew_meaning: string;
  arabic_script: string | null;
  item_type: "word" | "phrase" | "sentence";
  confidence: "low" | "high";
  notes: string;
};

const pdfExtractSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      item_number: { type: SchemaType.INTEGER, nullable: true },
      translit_nikud: { type: SchemaType.STRING },
      hebrew_meaning: { type: SchemaType.STRING },
      arabic_script: { type: SchemaType.STRING, nullable: true },
      item_type: { type: SchemaType.STRING, format: "enum", enum: ["word", "phrase", "sentence"] },
      confidence: { type: SchemaType.STRING, format: "enum", enum: ["low", "high"] },
      notes: { type: SchemaType.STRING },
    },
    required: ["item_number", "translit_nikud", "hebrew_meaning", "arabic_script", "item_type", "confidence", "notes"],
  },
};

const PDF_PASS1_PROMPT = `You extract vocabulary and sentence items from a single page image of the
Hebrew-transliteration Palestinian Arabic course book "לדבר בגובה העיניים" (Jerusalem/Jaffa dialect).
The book represents spoken Arabic using Hebrew letters with nikkud. You are given a rendered image
of the page -- there is no reliable embedded text layer for this book, so read directly from the
image, not from any text you might otherwise expect to find.

The page may contain:
- A NUMBERED vocabulary list (numbers usually run 1-64 within a מפגש/lesson unit). Set item_number
  to that number for these entries; otherwise leave item_number null.
- A plural form shown after the main word, often marked with "(ר)" (רבים = plural). Put the
  singular/base form in translit_nikud and note the plural form in notes, e.g. "רבים: <form>".
- Arabic script alongside the transliteration on some pages -- extract it into arabic_script when
  shown, otherwise leave it null.
- Sentence-practice lists: transliterated sentences paired with a Hebrew translation, matched by
  line/item number. Extract each pair as item_type "sentence": translit_nikud = the transliterated
  sentence, hebrew_meaning = the Hebrew translation.
- Grammar-rule pages: extract the example words/sentences shown (e.g. demonstratives like האדא,
  הדאכ with their meanings) as regular items too.

SKIP: exercise tables meant to be filled in by the student, blank drill pages, and pages that only
reference solutions/answer keys found elsewhere in the book. If the page has no extractable items,
return an empty array.

${CORE_RULES}

Return ONLY the JSON array, no prose.`;

const PDF_PASS2_PROMPT = `You are verifying a first-pass extraction of vocabulary/sentence items
from this page image (same course book, same rules as before). Below is the draft JSON your first
pass produced for this exact page.

Re-examine the image carefully and return a CORRECTED, COMPLETE list of items for this page:
- Fix any mis-transcribed translit_nikud, hebrew_meaning, arabic_script, or item_number.
- Add any items the draft missed entirely.
- Keep draft items that are already correct, unchanged (including their item_number).
- Do not drop correct items.

${CORE_RULES}

Draft (first-pass) JSON for this page:
`;

function pdfItemKey(item: PdfExtractedItem): string {
  return item.item_number !== null ? `n:${item.item_number}` : `t:${item.translit_nikud.trim()}`;
}

// Pass 2 returns pass 2's own confidence, but since it doesn't know what the
// draft's confidence was for unchanged items, we recompute confidence here:
// anything new or changed vs pass 1 is forced to "low" (it wasn't caught the
// first time, so it deserves a second look during QA even if Gemini itself
// felt sure); unchanged items keep their original pass-1 confidence.
function mergePdfPasses(pass1: PdfExtractedItem[], pass2: PdfExtractedItem[]): PdfExtractedItem[] {
  const byKey = new Map(pass1.map((item) => [pdfItemKey(item), item]));
  return pass2.map((item) => {
    const original = byKey.get(pdfItemKey(item));
    const unchanged =
      !!original &&
      original.translit_nikud === item.translit_nikud &&
      original.hebrew_meaning === item.hebrew_meaning &&
      original.arabic_script === item.arabic_script;
    return { ...item, confidence: unchanged ? original.confidence : "low" };
  });
}

export async function extractPdfPage(image: { mimeType: string; base64: string }): Promise<PdfExtractedItem[]> {
  const model = getModel(pdfExtractSchema);
  const imagePart = { inlineData: { mimeType: image.mimeType, data: image.base64 } };

  const pass1Result = await model.generateContent([PDF_PASS1_PROMPT, imagePart]);
  const pass1: PdfExtractedItem[] = JSON.parse(pass1Result.response.text());

  const pass2Result = await model.generateContent([
    PDF_PASS2_PROMPT + JSON.stringify(pass1),
    imagePart,
  ]);
  const pass2: PdfExtractedItem[] = JSON.parse(pass2Result.response.text());

  return mergePdfPasses(pass1, pass2);
}
