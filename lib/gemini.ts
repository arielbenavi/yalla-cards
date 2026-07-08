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

${CORE_RULES}
- notes: capture the literal translation and any usage explanation here (not just a copy of
  hebrew_meaning). Empty string "" if the message had nothing beyond the meaning itself.
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
