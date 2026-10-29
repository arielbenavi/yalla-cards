"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { strings } from "@/lib/strings";
import DailyTip from "@/components/DailyTip";
import AudioRangeEditor, { AudioRangeEditButton } from "@/components/AudioRangeEditor";
import type { DeckCard } from "@/lib/daily-queue";
import type { ReviewMode } from "@/mobile/src/App";
import "@/mobile/src/review.css";

// The daily review is one component everywhere (docs/one-app.md, stage 4): the
// offline-first review in mobile/src, here inside the site's layout. Its deck
// lives in this browser and grades sync through /api/mobile/*, so this page
// keeps working with no network, exactly like the offline page /app/ (which
// shares its storage). Client-only: it reads browser storage on load.
const ReviewApp = dynamic(() => import("@/mobile/src/App"), {
  ssr: false,
  loading: () => <div className="flex flex-1 items-center justify-center">{strings.common.loading}</div>,
});

function ReviewPageInner() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const mode: ReviewMode =
    ids.length > 0 ? { kind: "selected", ids } : searchParams.get("mode") === "all" ? { kind: "all" } : { kind: "daily" };

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => {});
  }, []);

  return (
    <>
      <DailyTip />
      <ReviewApp
        embedded
        mode={mode}
        adminSlot={isAdmin ? (card, afterSave) => <ClipRange card={card} afterSave={afterSave} /> : undefined}
      />
    </>
  );
}

/** Admin: adjust the card's clip range. A sync afterwards brings the new range to the deck. */
function ClipRange({ card, afterSave }: { card: DeckCard; afterSave: () => void }) {
  const [open, setOpen] = useState(false);
  if (!card.clip_path) return null;
  return (
    <>
      <AudioRangeEditButton onClick={() => setOpen(true)} />
      {open && (
        <AudioRangeEditor
          cardId={card.card_id}
          initialStart={card.audio_start_sec}
          initialEnd={card.audio_end_sec}
          onSaved={() => afterSave()}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewPageInner />
    </Suspense>
  );
}
