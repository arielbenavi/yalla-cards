# Downloads Ariel's saved words in MuFeed (table personal_dictionary, read-only, his own login)
# to scripts/mufeed/saved.json (gitignored), each with its dictionary entry and translations.
import sys, json, urllib.request, urllib.parse
sys.path.insert(0, "scripts/mufeed"); import mf
tok = mf.refresh() or mf.TOK
SEL = "id,saved_at,source,dictionary_entries!dictionary_entry_id(id,arabic_text,is_phrase,word_type,is_literary,info,arabic_plural,transliteration,transliteration_present,transliteration_plural,translations(hebrew_translation,tense,is_context))"
rows, f = [], 0
while True:
    r = urllib.request.Request(f"{mf.U}/rest/v1/personal_dictionary?select={urllib.parse.quote(SEL, safe=',()!_')}&order=saved_at&offset={f}&limit=1000", headers={"apikey": mf.K, "Authorization": "Bearer " + tok})
    page = json.load(urllib.request.urlopen(r, timeout=60)); rows += page; f += 1000
    if len(page) < 1000: break
json.dump(rows, open("scripts/mufeed/saved.json", "w"), ensure_ascii=False, indent=1)
print("saved", len(rows))
