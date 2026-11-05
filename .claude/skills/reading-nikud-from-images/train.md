# Blind reading test

Reads words whose answers you have not seen, then scores them mark by mark. Run it after changing
the procedure, and write the result in Lessons.

1. Copy `train-render.spec.ts` to `tests/e2e/zz-train.spec.ts`, set `OUT` to a scratchpad folder,
   run `npx playwright test tests/e2e/zz-train.spec.ts --retries=0`, then delete the copy.
   It picks 100 random chatifai-verified entries and renders them in bold Times. **Never print
   `answers.json`.**
2. Crop the rows at about 2.4×, read each one letter by letter into `mine.txt`, one per line.
3. `python3 -I train_score.py answers.json mine.txt` lists every difference.
4. Look at the crop again for each difference. Some answers turn out to be typos in the deck
   (a dagesh on א, two vowels on a letter): report those, don't count them as your error.

This tests mark reading on clean print, so its score is a ceiling. Scans are harder.
