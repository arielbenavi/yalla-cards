# Builds lookups.json (the shape cmp.py reads) from the downloaded dictionary instead of the RPC.
import json, re, os
S = os.path.dirname(__file__)
H = re.compile(r"[ً-ْٰـ]")
bare = lambda s: re.sub(r"[أإآ]", "ا", H.sub("", s or "")).replace("ى", "ي").replace("ة", "ه").replace("؟", "").replace("?", "").strip()
D = json.load(open(S + "/dict.json"))["dictionary_entries"]
idx = {}
for e in D:
    for a in re.split(r"\s*/\s*", e["arabic_text"] or ""):
        idx.setdefault(bare(a), []).append(e)
cards = json.load(open(S + "/cards.json")); L = {}
for c in cards:
    for p in re.split(r"\s*/\s*", c["arabic_script"] or ""):
        p = re.sub(r"[()]", "", p).strip()
        if p: L[p] = idx.get(bare(p), [])
json.dump(L, open(S + "/lookups.json", "w"), ensure_ascii=False)
print("parts", len(L), "found", sum(1 for v in L.values() if v))
