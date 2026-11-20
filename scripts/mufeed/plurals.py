# Looks up every word card without a plural in MuFeed and keeps exact matches that carry one.
import json, sys, re, unicodedata, time
sys.path.insert(0, "scripts/mufeed"); import mf
strip = lambda s: re.sub(r"[ً-ْـ\s؟?]", "", s or "").replace("أ","ا").replace("إ","ا").replace("آ","ا").replace("ة","ه").replace("ى","ي")
cards = json.load(open("scripts/mufeed/noplural.json"))
out = []
for i, c in enumerate(cards):
    ar = (c["arabic_script"] or "").split("/")[0].strip()
    if not ar or " " in ar: continue
    r = None
    for attempt in range(3):
        try: r = mf.rpc("search_dictionary_arabic", {"query_text": strip(ar)}); break
        except Exception as e: print("retry", e); time.sleep(3)
    if not isinstance(r, list): print("err", r); time.sleep(2); continue
    for x in r:
        if strip(x["arabic_text"].split("/")[0]) == strip(ar) and x.get("transliteration_plural"):
            out.append({"id": c["id"], "card": c["translit_nikud"], "he": c["hebrew_meaning"], "mf": x["transliteration"], "pl": x["transliteration_plural"], "type": x.get("word_type")}); break
    if i % 100 == 0:
        print(i, len(out), flush=True); json.dump(out, open("scripts/mufeed/plurals.json", "w"), ensure_ascii=False)
json.dump(out, open("scripts/mufeed/plurals.json", "w"), ensure_ascii=False, indent=1)
print("done", len(out))
