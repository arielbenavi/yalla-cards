"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";
import { formsGroup, type FormsWord } from "@/lib/forms-round";
import "@/mobile/src/review.css";

/** Best effort. The round writes to learning_events and nowhere else. */
function logEvent(event: string, cardId: string | null, meta: Record<string, unknown>) {
  fetch("/api/learning-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, card_id: cardId, meta }),
    keepalive: true,
  }).catch(() => {});
}

// סבב צורות (beta), docs/forms-round.md. No audio: the clips are of the singular.
export default function FormsPage() {
  const [words, setWords] = useState<FormsWord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [right, setRight] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    // Once, also under React's double effects in dev: "started" is counted
    if (loaded.current) return;
    loaded.current = true;
    fetch("/api/forms-round")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((d: { words: FormsWord[] }) => {
        setWords(d.words);
        if (d.words.length) logEvent("forms_round_started", null, { size: d.words.length });
      })
      .catch(() => setFailed(true));
  }, []);

  const current = words?.[index];

  const answer = useCallback(
    (correct: boolean) => {
      if (!current) return;
      logEvent("forms_answer", current.card_id, { form: "plural", correct, group: formsGroup(current.card_id) });
      if (correct) setRight((n) => n + 1);
      setRevealed(false);
      setIndex((i) => i + 1);
    },
    [current]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!current || e.repeat) return;
      if (e.key === " " && !revealed) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && (e.key === "1" || e.key === "2")) answer(e.key === "1");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, revealed, answer]);

  const toReview = (primary: boolean) => (
    <button className={primary ? "btn primary" : "btn side"} onClick={() => (location.href = "/review")}>
      חזרה לחזרה היומית
    </button>
  );

  let body;
  if (failed)
    body = (
      <div className="page center">
        <p className="error">לא הצלחתי לטעון את הסבב. צריך חיבור לאינטרנט.</p>
        {toReview(true)}
      </div>
    );
  else if (!words) body = <div className="page center muted">{strings.common.loading}</div>;
  else if (!current)
    body = (
      <div className="page center">
        {words.length > 0 ? (
          <>
            <h1>סיימת ✓</h1>
            <p className="muted" data-testid="forms-score">
              <bdi>{right}</bdi> מתוך <bdi>{words.length}</bdi> נכון
            </p>
          </>
        ) : (
          <p className="muted">אין כרגע מילים לסבב צורות</p>
        )}
        {toReview(true)}
      </div>
    );
  else
    body = (
      <div className="review">
        <div className="topbar">
          <span className="muted">
            סבב צורות (בטא) · <bdi>{index + 1}</bdi> מתוך <bdi>{words.length}</bdi>
          </span>
        </div>
        <div className="tile card" key={current.card_id}>
          <p className="prompt nikud">{current.translit_nikud}</p>
          <p className="muted">{current.hebrew_meaning}</p>
          {revealed ? (
            <p className="prompt nikud" data-testid="forms-plural">{current.plural_form}</p>
          ) : (
            <p className="big">רבים?</p>
          )}
        </div>
        <div className="actions">
          {!revealed ? (
            <button className="btn primary" onClick={() => setRevealed(true)}>
              {strings.review.showAnswer}
            </button>
          ) : (
            <div className="grades two">
              <button className="btn good" onClick={() => answer(true)}>ידעתי</button>
              <button className="btn again" onClick={() => answer(false)}>לא ידעתי</button>
            </div>
          )}
        </div>
      </div>
    );

  return <div className="yc embedded">{body}</div>;
}
