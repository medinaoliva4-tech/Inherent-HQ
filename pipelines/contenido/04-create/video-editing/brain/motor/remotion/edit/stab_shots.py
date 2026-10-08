#!/usr/bin/env python3
"""Estabiliza (y corrige color de) cada tramo usado en reels.json → public/stab/*.mp4 y escribe reels.resolved.json."""
import hashlib, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
MOTION = Path(__file__).resolve().parents[1]
ROOT = MOTION.parents[1]
IDX = {c["clip"]: c for c in json.loads((ROOT / "assets/videos/clips_index.json").read_text())}
OUT = MOTION / "public/stab"; OUT.mkdir(parents=True, exist_ok=True)
HEAD = 0.25   # margen antes del tramo (s de fuente)
LEAD = 0.6    # segundos de video extra para transiciones
reels = json.loads((Path(__file__).parent / "reels.json").read_text())
jobs = {}
for r in reels:
    for s in r["scenes"]:
        for x in s["shots"]:
            if x.get("win"):
                a, b = x["win"]
                key = f'{x["clip"]}_{a:.2f}-{b:.2f}_{x["mode"]}' + ("_g" + hashlib.md5(x["grade"].encode()).hexdigest()[:6] if x["grade"] else "")
                x["src"] = f"stab/{key}.mp4"; x["offset"] = round(x["from"] - a, 3)
                jobs[key] = (x["clip"], a, b, x["mode"], x["grade"])
                continue
            need = (s["dur"] + LEAD) * x["speed"]
            clipdur = IDX[x["clip"]]["duration"]
            a = max(0.0, x["from"] - HEAD)
            b = min(clipdur - 0.05, x["from"] + need + 0.1)
            if b - a < need + (x["from"] - a):   # el clip se acaba: se adelanta el inicio
                a = max(0.0, b - need - HEAD)
            key = f'{x["clip"]}_{a:.2f}-{b:.2f}_{x["mode"]}' + ("_g" + hashlib.md5(x["grade"].encode()).hexdigest()[:6] if x["grade"] else "")
            x["src"] = f"stab/{key}.mp4"
            x["offset"] = round(x["from"] - a, 3)   # segundo del archivo estabilizado donde empieza la toma
            jobs[key] = (x["clip"], a, b, x["mode"], x["grade"])
(Path(__file__).parent / "reels.resolved.json").write_text(json.dumps(reels, ensure_ascii=False, indent=1))
py = str(MOTION / ".venv/bin/python")
def run(item):
    key, (clip, a, b, mode, grade) = item
    out = OUT / f"{key}.mp4"
    if out.exists() and out.stat().st_size > 100_000:
        return f"{key}: ya existe"
    cmd = [py, str(MOTION / "scripts/stabilize.py"), clip, "--from", f"{a:.3f}", "--to", f"{b:.3f}", "--out", str(out)]
    if mode == "lock": cmd.append("--lock")
    elif mode == "none": cmd.append("--none")
    else: cmd += ["--radius", "45"]
    if grade: cmd += ["--grade", grade]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return (r.stdout.strip() or r.stderr.strip()[-300:])
print(len(jobs), "tramos", flush=True)
with ThreadPoolExecutor(int(sys.argv[1]) if len(sys.argv) > 1 else 3) as ex:
    for line in ex.map(run, jobs.items()):
        print(line, flush=True)
print("listo", flush=True)
