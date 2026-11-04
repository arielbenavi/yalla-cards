import type { SentenceWord, WordMatch } from "@/lib/word-lookup";
import { sentenceWords } from "@/lib/word-lookup";

// A sentence's words, each one a button. A one-word text has nothing to pick from.
export function TappableWords({
  text,
  arabic,
  onTap,
}: {
  text: string;
  arabic: string | null;
  onTap: (word: SentenceWord) => void;
}) {
  const words = sentenceWords(text, arabic);
  if (words.length < 2) return <>{text}</>;
  // The text stays as written: punctuation and symbols sit outside the buttons
  let next = 0;
  return (
    <>
      {text.trim().split(/\s+/).map((token, i) => {
        const word = words[next];
        const at = word ? token.indexOf(word.text) : -1;
        if (at < 0) return <span key={i}>{i > 0 && " "}{token}</span>;
        next++;
        return (
          <span key={i}>
            {i > 0 && " "}
            {token.slice(0, at)}
            <button type="button" className="word-tap" onClick={() => onTap(word)}>
              {word.text}
            </button>
            {token.slice(at + word.text.length)}
          </span>
        );
      })}
    </>
  );
}

export function WordSheet({
  word,
  match,
  gloss,
  requested,
  onRequest,
  onClose,
}: {
  word: SentenceWord;
  match: WordMatch;
  /** The word's meaning in this text, when the text comes with one. */
  gloss?: string;
  requested: boolean;
  onRequest: () => void;
  onClose: () => void;
}) {
  return (
    <div className="sheet word-sheet" role="dialog" aria-label={word.text}>
      <button className="sheet-backdrop" aria-label="סגור" onClick={onClose} />
      <div className="sheet-body">
        <p className="word-title nikud">{word.text}</p>
        {word.arabic && <p className="ar muted" dir="rtl">{word.arabic}</p>}
        {gloss && <p className="word-match" data-testid="word-gloss">{gloss}</p>}
        {match.cards.length > 0 ? (
          <>
            {!match.sure && <p className="muted small">אולי המילה הזאת, בצורה אחרת:</p>}
            {match.cards.map((c) => (
              <p key={c.card_id} className="word-match">
                <span className="nikud bold">{c.translit_nikud}</span> = {c.hebrew_meaning}
              </p>
            ))}
          </>
        ) : (
          <p className="muted">אין כרטיס למילה הזאת</p>
        )}
        <button className="btn primary" disabled={requested} onClick={onRequest}>
          {requested ? "נוסף לרשימה ✓" : "הוסף לרשימת תרגום"}
        </button>
      </div>
    </div>
  );
}
