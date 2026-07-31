# Arabic letter segmentation — reference table

Expected output of `lib/arabic-letters.ts` (see `docs/handoff-practice-section.md`, Stage 3a),
computed against **real `arabic_script` values from the cards table**.

Use these as test fixtures. If the implementation disagrees with any row here, the implementation
is wrong — these have been hand-checked against how the words actually render.

`ini` = initial, `med` = medial, `fin` = final, `iso` = isolated.

| word | translit | meaning | expected segmentation |
|---|---|---|---|
| كلب | כַּלְבּ | כלב | ك:ini · ل:med · ب:fin |
| بيت | בֵּית | בית | ب:ini · ي:med · ت:fin |
| ولاد | וְלַאד | ילדים | و:iso · ل:ini · ا:fin · د:iso |
| مرحبا | מַרְחַבַּא | שלום | م:ini · ر:fin · ح:ini · ب:med · ا:fin |
| حكومة | חֻכּוּמֶה | ממשלה | ح:ini · ك:med · و:fin · م:ini · ة:fin |
| عالي | עַאלִי | גבוה | ع:ini · ا:fin · ل:ini · ي:fin |
| قميص | קַמִיצ | חולצה | ق:ini · م:med · ي:med · ص:fin |
| زيتون | זֵיתוּן | זיתים | ز:iso · ي:ini · ت:med · و:fin · ن:iso |
| معلم | מְעַלֵּם | מורה | م:ini · ع:med · ل:med · م:fin |
| مدير | מֻדִיר | מנהל | م:ini · د:fin · ي:ini · ر:fin |
| شقة | שַקֵّה | דירה | ش:ini · ق:med · ة:fin |
| مشكلة | מֻשְכִּלֵה | בעיה | م:ini · ش:med · ك:med · ل:med · ة:fin |
| باب | בַּאבּ | דלת | ب:ini · ا:fin · ب:iso |
| أخو | — | (not a card) | أ:iso · خ:ini · و:fin |
| سيارة | — | (not a card) | س:ini · ي:med · ا:fin · ر:iso · ة:iso |

## The cases that catch bad implementations

Every one of these is a place a naive implementation gets it wrong. If your code passes the
easy words but fails these, the joining rule is not being applied.

**`ولاد` — `ل` is `initial`, not `medial`.** The preceding `و` is a non-connector, so `ل` starts
a new connected run even though it is not the first letter of the word. Same reason `د` is
`isolated`, not `final`.

**`باب` — the last `ب` is `isolated`, not `final`.** It follows `ا`, which doesn't join forward,
so there is nothing to its right to attach to. A "last letter is always final" shortcut fails here.

**`مدير` — `د` is `final` and the following `ي` is `initial`.** One word, two connected runs.

**`سيارة` — both `ر` and `ة` are `isolated`.** Two non-connectors in a row, each starting and
ending its own run.

**`زيتون` — `ز` is `isolated` and `ن` is `isolated`.** First letter isolated because `ز` never
joins forward; last letter isolated because it follows `و`, another non-connector.

**`حكومة` — `و` is `final`, then `م` restarts as `initial`.**

## Non-connector set

```
ا أ إ آ د ذ ر ز و ؤ ة ى ء
```

Everything else joins to the following letter. `ة` and `ى` occur word-finally only; `ء` stands
alone. `ئ` is a normal connector despite carrying a hamza.

## Note on duplicates

Several `arabic_script` values match more than one card row (this repo has `find-duplicates.ts`
and `merge-duplicates.ts` from previous cleanup passes). The letter drill selects *words*, so
duplicates would cause the same glyph sequence to be drilled twice under different card ids.
Worth de-duplicating on `arabic_script` in the queue query.
