// Lesson sources (migration 0028) and how a lesson is named in pickers.

export type LessonSource = "book" | "oral" | "preply" | "other";

export type Lesson = {
  id: string;
  date: string;
  title: string | null;
  source?: LessonSource;
  teacher?: string | null;
  meeting?: number | null;
};

export const SOURCE_LABEL: Record<LessonSource, string> = {
  book: "המדרשה",
  oral: "בעל פה",
  preply: "Preply",
  other: "אחר",
};

const ORDER: LessonSource[] = ["preply", "book", "oral", "other"];

/** "Preply · Yazeed S. · מפגש 1"; other sources keep their own title. */
export function lessonLabel(l: Lesson): string {
  if (l.source === "preply") {
    return ["Preply", l.teacher, l.meeting ? `מפגש ${l.meeting}` : null].filter(Boolean).join(" · ") || l.date;
  }
  return l.title || l.date;
}

/** Lessons grouped by source, each group newest first, for <optgroup>s. */
export function groupLessons(lessons: Lesson[]): { source: LessonSource; label: string; lessons: Lesson[] }[] {
  return ORDER.map((source) => ({
    source,
    label: SOURCE_LABEL[source],
    lessons: lessons
      .filter((l) => (l.source ?? "other") === source)
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
  })).filter((g) => g.lessons.length > 0);
}
