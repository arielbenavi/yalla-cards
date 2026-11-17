import json, sys, urllib.request, re, glob
D="/Users/arismac/Library/Containers/5835D3A9-05DB-4231-B637-73701976980C/Data/Library/Application Support/com.mufeedapp.learn/RCTAsyncLocalStorage_V1/"
U="https://iaxngbyvengjammmyfta.supabase.co"; K="sb_publishable_I6Lay9JZ_pS_29Ei_MlgfQ_pNIZ-PqH"
def token():
    for f in glob.glob(D+"*"):
        t=open(f,encoding="utf-8",errors="ignore").read()
        m=re.search(r'"access_token"\s*:\s*"([^"]+)"',t.replace('\\"','"'))
        if m: return m.group(1)
def refresh():
    for f in glob.glob(D+"*"):
        t=open(f,encoding="utf-8",errors="ignore").read().replace('\\"','"')
        m=re.search(r'"refresh_token"\s*:\s*"([^"]+)"',t)
        if m:
            r=urllib.request.Request(f"{U}/auth/v1/token?grant_type=refresh_token",data=json.dumps({"refresh_token":m.group(1)}).encode(),headers={"apikey":K,"Content-Type":"application/json"})
            try: return json.load(urllib.request.urlopen(r,timeout=30))["access_token"]
            except Exception: pass
TOK=token()
def rpc(fn, args):
    global TOK
    r=urllib.request.Request(f"{U}/rest/v1/rpc/{fn}",data=json.dumps(args).encode(),headers={"apikey":K,"Authorization":"Bearer "+TOK,"Content-Type":"application/json"})
    try: return json.load(urllib.request.urlopen(r,timeout=30))
    except urllib.error.HTTPError as e:
        b=e.read().decode()[:300]
        if e.code==401 and "expired" in b:
            n=refresh()
            if n and n!=TOK:
                TOK=n; return rpc(fn,args)
        return {"err":e.code,"body":b}
if __name__=="__main__":
    print("token found:", bool(TOK))
    for w in sys.argv[1:]: print(json.dumps(rpc("search_dictionary_arabic",{"query_text":w}),ensure_ascii=False)[:1500])
