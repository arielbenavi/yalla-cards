"""Scores a blind reading: python3 -I train_score.py answers.json mine.txt"""
import json, sys, unicodedata as u

def norm(s):
    s = s.replace("ّ", "ּ").replace("׳", "'").replace("’", "'").replace("ׁ", "").replace("ׂ", "")
    return u.normalize("NFC", s.strip())

answers = json.load(open(sys.argv[1], encoding="utf8"))
mine = open(sys.argv[2], encoding="utf8").read().splitlines()
bad = [(i, m, a) for i, (a, m) in enumerate(zip(answers, mine), 1) if norm(a) != norm(m)]
print(f"{len(answers) - len(bad)}/{len(answers)} exact (shin and sin dots ignored)")
for i, m, a in bad:
    print(f"{i}: mine {m} | answer {a}")
