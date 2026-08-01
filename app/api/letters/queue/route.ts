import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  LETTERS,
  BY_CHAR,
  letterStats,
  orderLetters,
  isMastered,
  pickDistractors,
  positionalForm,
  availableForms,
  DISTRACTOR_COUNT,
  type LetterId,
  type LetterMastery,
  type PositionalForm,
} from "@/lib/arabic-letters";

/** Builds a letter-recognition session (note 23486a6b). Read-only w.r.t. FSRS. */

/** Form mix after the first week, from the research — deliberately weighted away
 *  from the isolated form, which is over-represented in most teaching material. */
const FORM_WEIGHTS: [PositionalForm, number][] = [
  ["isolated", 0.2],
  ["initial", 0.2],
  ["medial", 0.3],
  ["final", 0.3],
];

function weightedForm(available: PositionalForm[]): PositionalForm {
  const pool = FORM_WEIGHTS.filter(([f]) => available.includes(f));
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [f, w] of pool) {
    r -= w;
    if (r <= 0) return f;
  }
  return pool[pool.length - 1][0];
}

export async function GET(request: Request) {
  const size = Math.min(30, Number(new URL(request.url).searchParams.get("size") ?? 15));
  const supabase = supabaseAdmin();

  const cards: { id: string; arabic_script: string | null; translit_nikud: string; hebrew_meaning: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("cards")
      .select("id, arabic_script, translit_nikud, hebrew_meaning")
      .not("arabic_script", "is", null)
      .range(from, from + 999);
    if (!data?.length) break;
    cards.push(...(data as typeof cards));
    if (data.length < 1000) break;
  }

  const [{ data: attempts }, { data: progress }] = await Promise.all([
    supabase
      .from("letter_attempts")
      .select("target_letter, positional_form, correct, selected_letter, session_id"),
    supabase.from("letter_progress").select("letter, introduced_at"),
  ]);

  // Mastery and the confusion matrix, both derived from the attempt log
  const mastery = new Map<LetterId, LetterMastery>();
  const confusions = new Map<string, number>();
  for (const a of attempts ?? []) {
    const m = mastery.get(a.target_letter) ?? {
      ch: a.target_letter,
      trials: 0,
      correct: 0,
      worstConfusion: 0,
      sessions: 0,
      formsSeen: 0,
    };
    m.trials++;
    if (a.correct) m.correct++;
    else if (a.selected_letter) {
      const key = `${a.target_letter}>${a.selected_letter}`;
      confusions.set(key, (confusions.get(key) ?? 0) + 1);
    }
    mastery.set(a.target_letter, m);
  }
  // Second pass: sessions and distinct forms per letter, and the worst confusion rate
  const sessionsByLetter = new Map<LetterId, Set<string>>();
  const formsByLetter = new Map<LetterId, Set<string>>();
  for (const a of attempts ?? []) {
    if (!sessionsByLetter.has(a.target_letter)) sessionsByLetter.set(a.target_letter, new Set());
    sessionsByLetter.get(a.target_letter)!.add(a.session_id);
    if (!formsByLetter.has(a.target_letter)) formsByLetter.set(a.target_letter, new Set());
    formsByLetter.get(a.target_letter)!.add(a.positional_form);
  }
  for (const [ch, m] of mastery) {
    m.sessions = sessionsByLetter.get(ch)?.size ?? 0;
    m.formsSeen = formsByLetter.get(ch)?.size ?? 0;
    let worst = 0;
    for (const [key, n] of confusions) {
      if (!key.startsWith(`${ch}>`)) continue;
      worst = Math.max(worst, n / m.trials);
    }
    m.worstConfusion = worst;
  }

  const words = cards.map((c) => c.arabic_script!).filter(Boolean);
  const stats = letterStats(words);
  const ordered = orderLetters(stats, words.length, mastery);

  let introduced = (progress ?? []).map((p) => p.letter as LetterId);

  // Introduce the next letter when every current one is either mastered or
  // still untried, and always start somebody off with the top-coverage letter.
  const activeUnmastered = introduced.filter((ch) => {
    const m = mastery.get(ch);
    return m && m.trials > 0 && !isMastered(m);
  });
  if (introduced.length === 0 || activeUnmastered.length < 2) {
    const next = ordered.find((s) => !introduced.includes(s.ch));
    if (next) {
      await supabase.from("letter_progress").upsert({ letter: next.ch }, { onConflict: "letter" });
      introduced = [...introduced, next.ch];
    }
  }

  // Build trials, weighted toward letters that are not yet solid
  const weightFor = (ch: LetterId) => {
    const m = mastery.get(ch);
    if (!m || m.trials === 0) return 3;
    return isMastered(m) ? 0.5 : 2;
  };

  const items = [];
  for (let i = 0; i < size; i++) {
    const totalW = introduced.reduce((s, ch) => s + weightFor(ch), 0);
    let r = Math.random() * totalW;
    let target = introduced[introduced.length - 1];
    for (const ch of introduced) {
      r -= weightFor(ch);
      if (r <= 0) {
        target = ch;
        break;
      }
    }

    const m = mastery.get(target);
    const familiar = (m?.trials ?? 0) >= 10;
    const nDistractors = familiar ? DISTRACTOR_COUNT.familiar : DISTRACTOR_COUNT.learning;
    const form = weightedForm(availableForms(target));

    // A word the learner already knows, containing this letter — the research's
    // "recognise it in context" step, and the reason coverage drives ordering
    const inWord = cards.filter((c) => c.arabic_script!.includes(target));
    const example = inWord.length ? inWord[Math.floor(Math.random() * inWord.length)] : null;

    const distractors = pickDistractors(target, introduced, confusions, nDistractors);
    // Early on there may not be enough introduced letters to distract with
    if (distractors.length === 0) {
      const filler = LETTERS.filter((l) => l.ch !== target)
        .slice(0, nDistractors)
        .map((l) => l.ch);
      distractors.push(...filler);
    }

    const choices = [target, ...distractors].sort(() => Math.random() - 0.5);

    items.push({
      target,
      form,
      glyph: positionalForm(target, form),
      sound: BY_CHAR.get(target)?.sound ?? "",
      name: BY_CHAR.get(target)?.name ?? "",
      choices: choices.map((ch) => ({
        ch,
        sound: BY_CHAR.get(ch)?.sound ?? "",
        glyph: positionalForm(ch, form) ?? ch,
      })),
      example: example
        ? {
            card_id: example.id,
            arabic: example.arabic_script,
            translit: example.translit_nikud,
            he: example.hebrew_meaning,
          }
        : null,
    });
  }

  return NextResponse.json({
    items,
    introduced,
    mastered: introduced.filter((ch) => {
      const m = mastery.get(ch);
      return m ? isMastered(m) : false;
    }),
    coverage: ordered.slice(0, 8).map((s) => ({ ch: s.ch, words: s.words, occurrences: s.occurrences })),
  });
}
