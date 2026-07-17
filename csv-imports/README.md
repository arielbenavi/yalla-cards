# סכמת ייבוא מילים — yalla-cards

## פקודת הרצה

```bash
npx tsx --env-file=.env.local scripts/import-csv.ts csv-imports/<filename>.csv "<שם מפגש>"
```

הסקריפט idempotent — אפשר להריץ כמה פעמים, שורות קיימות ידולגו.

## פורמט CSV

| עמודה | חובה | תיאור |
|---|---|---|
| `item_number` | לא | מספר פריט בתוך המפגש (1, 2, 3...). אם קיים, יתווסף כ-"פריט N. " בתחילת ה-notes |
| `translit_nikud` | כן | תעתיק באותיות עבריות עם ניקוד (שפה דבורה ערבית) |
| `hebrew_meaning` | כן | תרגום לעברית |
| `arabic_script` | לא | כתיב ערבי (רק אם מופיע בחומר) |
| `item_type` | כן | `word` / `phrase` / `sentence` |
| `notes` | לא | הערות בעברית: הקשר שימוש, צורת רבים, הבדל מילולי/יומיומי וכו' |

## כללים

- כל שדה שעוטף `**bold**` — הסקריפט מסיר את הכוכביות אוטומטית.
- **dedup**: השוואה לפי `translit_nikud` ללא ניקוד — שורה שכבר קיימת ב-DB תדולג.
- **notes**: כתוב תמיד בעברית. דוגמאות לתוכן notes:
  - `רבים: מַדַארֶס (בתי ספר)`
  - `שימוש לגבר בלבד`
  - `מילולית: שלום לפניך — בפועל: שלום`
- כל קארד מקבל אוטומטית שורת `card_srs` בכיוון `he_to_ar`.

## שמות קבצים

`<lesson_slug>_import.csv` — לדוגמה:
- `meeting1_part1_import.csv`
- `meeting1_part2_import.csv`
- `meeting2_import.csv`
