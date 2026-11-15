import json, re, os, unicodedata
S=os.path.dirname(__file__)
cards=json.load(open(S+"/cards.json")); L=json.load(open(S+"/lookups.json"))
HARAKAT=re.compile(r"[ً-ْٰـ]")
def bare_ar(s): s=HARAKAT.sub("",s); return re.sub(r"[أإآ]","ا",s).replace("ى","ي").replace("ة","ه").strip()
FIN=str.maketrans("ךםןףץ","כמנפצ")
def norm_he(s):
    s=unicodedata.normalize("NFD",s or "").replace("׳","'").replace("’","'").replace("`","'")
    s=s.replace("ّ","ּ").replace("ׁ","")
    s=re.sub(r"[()\s\-–]","",s).translate(FIN)
    out=[]
    for m in re.finditer(r"([^֑-ׇ'])([֑-ׇ']*)",s):
        out.append(m.group(1)+"".join(sorted(set(m.group(2)))))
    return "".join(out)
def cons(s): return re.sub(r"[֑-ׇ]","",s)
def drop_initial_alef_vowel(s): return re.sub(r"^(א)[ְ-ּ]+",r"\1",s)
res=[]
for c in cards:
    ar=[re.sub(r"[()]","",p).strip() for p in re.split(r"\s*/\s*",c["arabic_script"] or "") if p.strip()]
    he=[p for p in re.split(r"\s*/\s*",c["translit_nikud"] or "") if p.strip()]
    parts=[]
    for i,p in enumerate(ar):
        hits=L.get(p)
        if hits:
            ex=[]
            for h in hits:
                aa=re.split(r"\s*/\s*",h["arabic_text"] or ""); tt=re.split(r"\s*/\s*",h["transliteration"] or "")
                for j,a2 in enumerate(aa): ex.append({"arabic_text":a2,"transliteration":tt[j] if j<len(tt) else tt[0]})
            hits=ex
        if hits is None: parts.append(("missing",p,None,None)); continue
        exact=[h for h in hits if bare_ar(h["arabic_text"])==bare_ar(p)]
        if not exact: parts.append(("none",p,None,None)); continue
        ours=norm_he(he[i]) if i<len(he) else norm_he(c["translit_nikud"])
        best=None
        for h in exact:
            th=norm_he(h["transliteration"] or "")
            if th==ours: st="same"
            elif drop_initial_alef_vowel(th)==drop_initial_alef_vowel(ours): st="same_alef"
            elif cons(th)==cons(ours): st="nikud"
            else: st="diff"
            rank={"same":0,"same_alef":1,"nikud":2,"diff":3}[st]
            if best is None or rank<best[0]: best=(rank,st,h)
        parts.append((best[1],p,best[2]["transliteration"],best[2]["arabic_text"]))
    sts=[x[0] for x in parts]
    if sts and all(s in("same","same_alef") for s in sts): v="verify"
    elif any(s in("nikud","diff") for s in sts): v="review"
    else: v="notfound"
    res.append({**c,"verdict":v,"parts":parts})
json.dump(res,open(S+"/result.json","w"),ensure_ascii=False,indent=0)
from collections import Counter
print(Counter(r["verdict"] for r in res)); print(Counter(s[0] for r in res for s in r["parts"]))
