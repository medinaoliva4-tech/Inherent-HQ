import json, subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT/"assets/videos/source"; IDX = {c["clip"]: c for c in json.loads((ROOT/"assets/videos/clips_index.json").read_text())}
OUT = Path(__file__).parent/"page/thumbs"; OUT.mkdir(parents=True, exist_ok=True)
TMP = Path(__file__).parent/"_tmp"; TMP.mkdir(exist_ok=True)
W, H = 360, 640
def grab(clip, t, key):
    p = TMP/f"{key}.jpg"
    subprocess.run(["ffmpeg","-v","error","-y","-ss",f"{t:.2f}","-i",str(SRC/IDX[clip]["file"]),"-frames:v","1","-vf",f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}","-q:v","3",str(p)],check=True)
    return Image.open(p).convert("RGB")
def mid(sh): return sh["from"] + (sh["to"]-sh["from"])*0.55
def build(job):
    vid, sc = job
    out = OUT/f"{sc['id']}.jpg"
    if sc["layout"] == "cierre":
        Image.open(Path(__file__).parent/"_endcard.jpg").save(out, quality=82); return
    if sc["layout"] == "full":
        sh = sc["shots"][0]; grab(sh["clip"], mid(sh), sc["id"]).save(out, quality=82); return
    gap = 6; hh = (H-gap)//2
    img = Image.new("RGB",(W,H),(178,145,102))
    for k, sh in enumerate(sc["shots"][:2]):
        im = grab(sh["clip"], mid(sh), f"{sc['id']}_{k}")
        fy = sh.get("focusY") or 0.5
        y0 = int((H-hh)*fy)
        img.paste(im.crop((0,y0,W,y0+hh)),(0,0 if k==0 else hh+gap))
    img.save(out, quality=82)
data = json.loads((Path(__file__).parent/"storyboard.json").read_text())
# fotograma del cierre de marca (render del V01)
# fotograma del cierre de marca: una captura del cierre ya renderizado (o cualquier imagen 9:16) en _endcard.jpg
jobs = [(v["id"], sc) for v in data for sc in v["scenes"]]
with ThreadPoolExecutor(8) as ex: list(ex.map(build, jobs))
print(len(jobs), "fotogramas")
