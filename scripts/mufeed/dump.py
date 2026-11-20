# Downloads MuFeed's dictionary (read-only, with Ariel's own login) to dict.json (gitignored).
import sys, json, urllib.request
sys.path.insert(0, "scripts/mufeed"); import mf
tok = mf.refresh() or mf.TOK
def get(path):
    r = urllib.request.Request(f"{mf.U}/rest/v1/{path}", headers={"apikey": mf.K, "Authorization": "Bearer " + tok})
    return json.load(urllib.request.urlopen(r, timeout=60))
out = {}
for t in ["dictionary_entries", "translations"]:
    rows, f = [], 0
    while True:
        page = get(f"{t}?select=*&order=id&offset={f}&limit=1000"); rows += page; f += 1000
        if len(page) < 1000: break
    out[t] = rows; print(t, len(rows), list(rows[0].keys()) if rows else "")
json.dump(out, open("scripts/mufeed/dict.json", "w"), ensure_ascii=False)
