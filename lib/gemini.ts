import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

export type ParsedCard = {
  hebrew_meaning: string;
  translit_nikud: string;
  item_type: "word" | "phrase" | "sentence";
  confidence: "low" | "high";
};

const responseSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      hebrew_meaning: { type: SchemaType.STRING },
      translit_nikud: { type: SchemaType.STRING },
      item_type: { type: SchemaType.STRING, format: "enum", enum: ["word", "phrase", "sentence"] },
      confidence: { type: SchemaType.STRING, format: "enum", enum: ["low", "high"] },
    },
    required: ["hebrew_meaning", "translit_nikud", "item_type", "confidence"],
  },
};

const SYSTEM_PROMPT = `You parse notes for a Palestinian Arabic (Jerusalem/Jaffa dialect) vocabulary app.
Input is either pasted lesson notes or a photo of a handwritten notebook page. Each line typically
has the format "transliteration — Hebrew meaning" (transliteration is Hebrew script with nikkud,
representing spoken Arabic; the dash may be "-", "–", "—", or missing).

For each item, produce:
- hebrew_meaning: the Hebrew meaning/translation, cleaned up.
- translit_nikud: the Hebrew-letter transliteration WITH nikkud. If nikkud is missing or illegible
  in a photo, infer standard nikkud using common Hebrew-transliteration conventions for Levantine
  Arabic, and set confidence to "low". If nikkud is clear, set confidence to "high".
- item_type: "word" for a single word, "phrase" for a short expression, "sentence" for a full sentence.
- confidence: "low" if you had to guess/infer anything (nikkud, illegible handwriting, ambiguous
  meaning), otherwise "high".

Return ONLY the JSON array, no prose. If a line is unreadable or not a vocabulary item, skip it.`;

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });
}

export async function parseLessonText(text: string): Promise<ParsedCard[]> {
  const model = getModel();
  const result = await model.generateContent([SYSTEM_PROMPT, `Lesson notes:\n${text}`]);
  return JSON.parse(result.response.text());
}

export async function parseLessonImages(
  images: { mimeType: string; base64: string }[]
): Promise<ParsedCard[]> {
  const model = getModel();
  const parts = [
    SYSTEM_PROMPT,
    ...images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.base64 },
    })),
  ];
  const result = await model.generateContent(parts);
  return JSON.parse(result.response.text());
}
