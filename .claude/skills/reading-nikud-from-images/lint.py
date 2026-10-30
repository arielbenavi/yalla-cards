#!/usr/bin/env python3
"""Lint pointed Hebrew-letter transliteration before it goes into cards.

  python3 -I lint.py "line one" "line two" ...     (or one per line on stdin)

Flags what a visual read gets wrong in ways a second look at the image will
not catch, because the error is in the characters typed, not in the reading:
- Arabic diacritics (fatha…sukun, shadda U+0651) inside Hebrew text — the
  Hebrew dagesh is U+05BC;
- a letter carrying two vowels, or a vowel and a sheva;
- a final-form letter (ך ם ן ף ץ) inside a word, or a non-final form at a word end
  where this course uses the final form (it writes מ/נ final as ם/ן);
- geresh written as ׳ (U+05F3) or ’ instead of the ' the deck uses;
- doubled marks (two daggesh, two holam).
Exit code 1 when anything is flagged.
"""
import re, sys, unicodedata

VOWELS = set("ְֱֲֳִֵֶַָׇֹֺֻ")
LETTER = re.compile(r"[א-ת]")
FINAL = set("ךםןףץ")

def lint(s):
    out = []
    for m in re.finditer(r"[ً-ْٰ]", s):
        out.append(f"Arabic mark {unicodedata.name(m.group())} at {m.start()} — use Hebrew nikud (dagesh = U+05BC)")
    if re.search(r"[׳’]", s):
        out.append("geresh as ׳ or ’ — the deck uses '")
    # group each letter with the marks that follow it
    for m in re.finditer(r"([א-ת])([֑-ׇ]*)", s):
        marks = m.group(2)
        v = [c for c in marks if c in VOWELS]
        if len(v) > 1 and not (len(v) == 2 and "ֹ" in v and m.group(1) == "ו"):
            out.append(f"'{m.group(0)}' at {m.start()} has {len(v)} vowels")
        if marks.count("ּ") > 1:
            out.append(f"'{m.group(0)}' at {m.start()} has two dagesh")
    for w in re.findall(r"[א-ת֑-ׇ']+", s):
        base = re.sub(r"[^א-ת]", "", w)
        if any(c in FINAL for c in base[:-1]):
            out.append(f"final letter inside '{w}'")
    return out

lines = sys.argv[1:] or [l.rstrip("\n") for l in sys.stdin if l.strip()]
bad = 0
for l in lines:
    for p in lint(l):
        bad += 1
        print(f"✗ {l[:50]}…  {p}")
print("✓ clean" if not bad else f"{bad} issue(s)")
sys.exit(1 if bad else 0)
