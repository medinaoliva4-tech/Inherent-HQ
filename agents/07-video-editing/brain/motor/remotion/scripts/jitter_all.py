import json, re, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from jitter import jitter
IDX = {c["clip"]: c for c in json.load(open("../../assets/videos/clips_index.json"))}
files = sorted(Path("public/stab").glob("*.mp4"))
def one(p):
    m = re.match(r"(R\d_\d\d)_([\d.]+)-([\d.]+)_(\w+?)(_g\w+)?\.mp4", p.name)
    clip, a, b = m.group(1), float(m.group(2)), float(m.group(3))
    return p.name, round(jitter(Path("../../assets/videos/source") / IDX[clip]["file"], a, b - a), 2), round(jitter(p), 2)
with ThreadPoolExecutor(8) as ex:
    res = list(ex.map(one, files))
json.dump(res, open("out/qa/jitter.json", "w"))
for n, o, s in res:
    print(f"{n:45s} orig {o:5.2f}  stab {s:5.2f}  {'STAB' if s < o * 0.8 else 'ORIG'}")
