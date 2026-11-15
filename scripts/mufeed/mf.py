import json, sys, urllib.request, re, glob
D="/Users/arismac/Library/Containers/5835D3A9-05DB-4231-B637-73701976980C/Data/Library/Application Support/com.mufeedapp.learn/RCTAsyncLocalStorage_V1/"
U="https://iaxngbyvengjammmyfta.supabase.co"; K="sb_publishable_I6Lay9JZ_pS_29Ei_MlgfQ_pNIZ-PqH"
def token():
    for f in glob.glob(D+"*"):
        t=open(f,encoding="utf-8",errors="ignore").read()
        m=re.search(r'"access_token"\s*:\s*"([^"]+)"',t.replace('\\"','"'))
        if m: return m.group(1)
TOK=token()
def rpc(fn, args):
    r=urllib.request.Request(f"{U}/rest/v1/rpc/{fn}",data=json.dumps(args).encode(),headers={"apikey":K,"Authorization":"Bearer "+TOK,"Content-Type":"application/json"})
    try: return json.load(urllib.request.urlopen(r,timeout=30))
    except urllib.error.HTTPError as e: return {"err":e.code,"body":e.read().decode()[:300]}
if __name__=="__main__":
    print("token found:", bool(TOK))
    for w in sys.argv[1:]: print(json.dumps(rpc("search_dictionary_arabic",{"query_text":w}),ensure_ascii=False)[:1500])
