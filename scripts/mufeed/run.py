import json, sys, time, os, re
sys.path.insert(0, os.path.dirname(__file__)); import mf
S=os.path.dirname(__file__); cards=json.load(open(S+"/cards.json"))
cp=S+"/lookups.json"; cache=json.load(open(cp)) if os.path.exists(cp) else {}
parts=[]
for c in cards:
    for p in re.split(r"\s*/\s*", c["arabic_script"] or ""):
        p=re.sub(r"[()]","",p).strip()
        if p and p not in cache and p not in parts: parts.append(p)
print("to look up:", len(parts), flush=True)
for i,p in enumerate(parts):
    r=mf.rpc("search_dictionary_arabic",{"query_text":p})
    if isinstance(r,dict) and r.get("err"):
        print("ERR",p,r,flush=True)
        if r["err"] in (401,403): break
        time.sleep(3); continue
    cache[p]=r
    if i%50==0: json.dump(cache,open(cp,"w"),ensure_ascii=False); print(i,flush=True)
    time.sleep(0.25)
json.dump(cache,open(cp,"w"),ensure_ascii=False); print("done",len(cache))
