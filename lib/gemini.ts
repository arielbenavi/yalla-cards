import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

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
  when addressing a man" or "literally: my neighbor"). Empty string "" if there's nothing to add.
  IMPORTANT: notes must always be written in HEBREW. Never write notes in English or Arabic.`;

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

function getGeminiModel(modelName: string, schema: Schema) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
}

// gemini-2.5-flash is deprecated; use 3.1-flash-lite for cheap text/vision tasks
const FLASH_MODEL = "gemini-3.1-flash-lite";

export async function parseLessonText(text: string): Promise<ParsedCard[]> {
  const model = getGeminiModel(FLASH_MODEL, responseSchema);
  const result = await model.generateContent([SYSTEM_PROMPT, `Lesson notes:\n${text}`]);
  return JSON.parse(result.response.text());
}

export async function parseLessonImages(
  images: { mimeType: string; base64: string }[]
): Promise<ParsedCard[]> {
  const model = getGeminiModel(FLASH_MODEL, responseSchema);
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
  const model = getGeminiModel(FLASH_MODEL, whatsappResponseSchema);
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
  page_kind: "vocabulary" | "reference";
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
      page_kind: { type: SchemaType.STRING, format: "enum", enum: ["vocabulary", "reference"] },
    },
    required: ["item_number", "translit_nikud", "hebrew_meaning", "arabic_script", "item_type", "confidence", "notes", "page_kind"],
  },
};

const PDF_PASS1_PROMPT = `You extract vocabulary and sentence items from a single page image of the
Hebrew-transliteration Palestinian Arabic course book "לדבר בגובה העיניים" (Jerusalem/Jaffa dialect).
The book represents spoken Arabic using Hebrew letters with nikkud. You are given a rendered image
of the page -- there is no reliable embedded text layer for this book, so read directly from the
image, not from any text you might otherwise expect to find.

CRITICAL FIELD RULES:
- translit_nikud: MUST contain the spoken Arabic transliterated into Hebrew letters (e.g. "יָא גָ'אר
  אִינְתָה"). For sentence items, this is the Arabic sentence. NEVER put plain Hebrew in this field.
  If a row's "translit" reads as plain Hebrew with no Arabic dialect words, it is mis-assigned.
- hebrew_meaning: MUST contain the Hebrew translation/meaning (plain Hebrew, not Arabic).
- arabic_script: Copy the Arabic-script text ONLY IF Arabic script letters (ا ب ت ...) are
  VISUALLY PRESENT on this specific page image. NEVER generate, translate, or infer Arabic script.
  If you do not see actual Arabic script characters on the page, set arabic_script to null.
- notes: MUST be written in HEBREW only. Never write notes in English or Arabic.
- page_kind: Set to "reference" if this page is primarily a nikkud-sign chart, alphabet/letter table,
  fill-in-the-blank exercise template, or answer key. Set to "vocabulary" for all other pages
  (vocabulary lists, sentence-practice lists, grammar-example pages). Every item on the page gets
  the same page_kind value matching the page type.

The page may contain:
- A NUMBERED vocabulary list (numbers usually run 1-64 within a מפגש/lesson unit). Set item_number
  to that number for these entries; otherwise leave item_number null.
- A plural form shown after the main word, often marked with "(ר)" (רבים = plural). Put the
  singular/base form in translit_nikud and note the plural form in notes, e.g. "רבים: <form>".
- Sentence-practice lists: transliterated sentences paired with a Hebrew translation. Extract each
  pair as item_type "sentence": translit_nikud = the Arabic sentence in Hebrew script,
  hebrew_meaning = the Hebrew translation.
- Grammar-rule pages: extract example words/sentences as regular vocabulary items.

SKIP: exercise tables meant to be filled in by the student, blank drill pages, and pages that only
reference solutions/answer keys. If the page has no extractable items, return an empty array.

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
- arabic_script: ONLY copy Arabic script if you can literally see Arabic letters on this page image.
  Never generate or translate. If not visible, null.
- notes must be in HEBREW only.
- page_kind must be consistent across all items on this page ("vocabulary" or "reference").

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

const RETRY_DELAYS_MS = [5000, 15000, 45000];

function isRetryableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /\b(503|429)\b/.test(message) || /overloaded|fetch failed|network|ECONNRESET|ETIMEDOUT/i.test(message);
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === RETRY_DELAYS_MS.length || !isRetryableError(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
  throw lastErr;
}

// --- Parser backends ---

type ImagePart = { mimeType: string; base64: string };

interface PdfParserBackend {
  generateJson(prompt: string, image: ImagePart): Promise<PdfExtractedItem[]>;
}

function extractJsonArray(text: string): PdfExtractedItem[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]);
}

class GeminiPdfBackend implements PdfParserBackend {
  private model: ReturnType<InstanceType<typeof GoogleGenerativeAI>["getGenerativeModel"]>;

  constructor(modelName: string) {
    this.model = getGeminiModel(modelName, pdfExtractSchema);
  }

  async generateJson(prompt: string, image: ImagePart): Promise<PdfExtractedItem[]> {
    const imagePart = { inlineData: { mimeType: image.mimeType, data: image.base64 } };
    const result = await withRetry(() => this.model.generateContent([prompt, imagePart]));
    return JSON.parse(result.response.text());
  }
}

class AnthropicPdfBackend implements PdfParserBackend {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateJson(prompt: string, image: ImagePart): Promise<PdfExtractedItem[]> {
    const response = await withRetry(() =>
      this.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: image.mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
                  data: image.base64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      })
    );
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return extractJsonArray(text);
  }
}

// gemini-2.5-pro is deprecated; gemini-3.1-pro-preview is the current high-quality model.
// Set PARSER_MODEL env var to override (e.g. "gemini-3.1-flash-lite" or "anthropic/claude-sonnet-4-6").
const DEFAULT_PDF_MODEL = "gemini-3.1-pro-preview";

function getPdfParserBackend(): PdfParserBackend {
  const model = process.env.PARSER_MODEL ?? DEFAULT_PDF_MODEL;
  if (model.startsWith("anthropic/") || model === "claude-sonnet-4-6") {
    return new AnthropicPdfBackend();
  }
  return new GeminiPdfBackend(model);
}

export async function extractPdfPage(image: { mimeType: string; base64: string }): Promise<PdfExtractedItem[]> {
  const backend = getPdfParserBackend();

  const pass1 = await backend.generateJson(PDF_PASS1_PROMPT, image);

  const pass2 = await backend.generateJson(
    PDF_PASS2_PROMPT + JSON.stringify(pass1),
    image
  );

  return mergePdfPasses(pass1, pass2);
}
