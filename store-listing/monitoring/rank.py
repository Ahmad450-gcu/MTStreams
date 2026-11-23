import json,sys,urllib.request,urllib.parse,datetime,re,time
BASE="https://storeedgefd.dsx.mp.microsoft.com"
def fetch(url):
    for a in range(3):
        try: return json.loads(urllib.request.urlopen(url,timeout=30).read().decode("utf-8"))
        except Exception as e: err=e; time.sleep(1.5)
    raise err
def products(d,seen,out):
    def walk(o):
        if isinstance(o,dict):
            if 'ProductId' in o and 'Title' in o and o['ProductId'] not in seen:
                seen.add(o['ProductId']);out.append((o['ProductId'],o['Title']))
            for v in o.values(): walk(v)
        elif isinstance(o,list):
            for v in o: walk(v)
    walk(d)
def nexturi(d):
    m=re.search(r'"NextUri":\s*"([^"]+)"',json.dumps(d)); return m.group(1) if m else None
def ranked(q,market="US",locale="en-US",pages=5):
    url=BASE+"/v9.0/pages/searchResults?"+urllib.parse.urlencode({"query":q,"mediaType":"all","market":market,"locale":locale,"deviceFamily":"Windows.Desktop"})
    seen=set();out=[]
    for p in range(pages):
        d=fetch(url); n=len(out); products(d,seen,out)
        nu=nexturi(d)
        if not nu or len(out)==n: break
        url=BASE+nu
    return out
TARGETS={"9P3WKH0ZJV65":"MoviesFlix","9MTX2B3S2DJL":"MTStreams"}
if __name__=="__main__":
    markets=sys.argv[1].split(","); qs=sys.argv[2:]
    for m in markets:
        for q in qs:
            r=ranked(q,m)
            pos={v:next((i+1 for i,(pid,_) in enumerate(r) if pid==k),None) for k,v in TARGETS.items()}
            print(f"{datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%d %H:%MZ')} | {m} | {q!r} | scanned {len(r)} | MoviesFlix {pos['MoviesFlix'] or '-'} | MTStreams {pos['MTStreams'] or '-'}",flush=True)
