// Duplicate pairs that share a transliteration but were worded differently on
// the Hebrew side, so the automatic same-meaning merge could not group them.
// Each row is a judgement made by reading both cards.
//
// `meaning` is the gloss the surviving card ends up with — usually the more
// specific of the two.
//
// Deliberately NOT here, because they are different words:
//   מַרַّה (پעם) vs מַרַה (אישה)      — the shadda is the whole difference
//   חַמַّאם (שירותים) vs חַמַאם (יונים)
//   שַמַאל (צפון) vs שְמַאל (שמאל)
//   קַמִיצ (חולצה) vs (חולצה מכופתרת) — both reviewed, needs Ariel
//   بيحكي stored for both "אני מדבר" and "מדבר" — one of the two Arabic
//     spellings is wrong (بحكي vs بيحكي); needs chatifai, not a merge.
export type Decision = { keep: string; drop: string; meaning: string; why?: string };

export const DECISIONS: Decision[] = [
  { keep: "82e5d569", drop: "2fad9999", meaning: "מורה (ז)" },
  { keep: "970d237e", drop: "3496dd40", meaning: "מזכיר של גוף רשמי / ישר, אמין / שם של גבר" },
  { keep: "4a9411f2", drop: "5624b62a", meaning: "עורך דין" },
  { keep: "a6264d17", drop: "c5c6332e", meaning: "חברה (עסקית)" },
  { keep: "d8215153", drop: "2a53b749", meaning: "מזכירה של גוף רשמי / ישרה, אמינה / שם של בחורה" },
  { keep: "647d3dca", drop: "e412c571", meaning: "שירותים / אמבטיה", why: "יונים נשאר כרטיס נפרד" },
  { keep: "c7ffb411", drop: "d8f7ef3e", meaning: "מורה (נ)" },
  { keep: "6d980f23", drop: "3a393508", meaning: "חברה (נ) / בעלת מקום" },
  { keep: "bd1a94d1", drop: "ed136ea9", meaning: "דלת / שער" },
  { keep: "3b8d7757", drop: "91f24443", meaning: "עמוד (בספר)" },
  { keep: "8509be70", drop: "bcc420cc", meaning: "חוץ / בחוץ / החוצה" },
  { keep: "95090158", drop: "adc981ed", meaning: "מקור / מקורי" },
  { keep: "c7123e1b", drop: "493d7931", meaning: "דירה", why: "שני כרטיסים זהים באותו שיעור" },
  { keep: "9f620112", drop: "1047972c", meaning: "קו (גם קו אוטובוס)" },
  { keep: "2a984190", drop: "f41ee385", meaning: "עַם / אומה" },
  { keep: "538efd3c", drop: "87884ddb", meaning: "מאחורי", why: "ورا המדובר, לא وراء הספרותי" },
  { keep: "fc22d87e", drop: "b202999f", meaning: "טוב / בסדר", why: "مناح שגוי, منيح נכון" },
  { keep: "4fbb0275", drop: "491d3f02", meaning: "ילד / בן" },
  { keep: "b1545d68", drop: "9de1121d", meaning: "חבר / בעל מקום" },
  { keep: "58171ee2", drop: "ecb06cca", meaning: "אשר / ש..." },
  { keep: "6a29a157", drop: "cd4c0f51", meaning: "קצבייה / אטליז" },
  // 19dc3f4d is the reviewed one (2 חזרות) — the scanner reported 0 for both
  // because it read review_log unpaged and hit the 1000-row cap.
  { keep: "19dc3f4d", drop: "aeeaecf4", meaning: "דודה (אחות האם)" },
];
