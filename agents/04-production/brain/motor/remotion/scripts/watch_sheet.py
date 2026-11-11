#!/usr/bin/env python3
"""Calificación con /watch en tiempos exactos.

Corre el script de la skill /watch (modo cue: --detail transcript --timestamps) sobre el proxy de
cada clip, con un fotograma cada `paso` segundos, y arma una hoja de contacto rotulada con el
tiempo exacto de cada fotograma (evita el desfase de las etiquetas de la pasada uniforme).

Uso: python3 scripts/watch_sheet.py R2_01 R2_02 ... [--step 1.0] [--w 160]
"""
import json
import os
import tempfile
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WATCH = os.environ.get("WATCH_SCRIPT", str(Path.home() / ".claude/skills/watch/scripts/watch.py"))  # skill /watch
MOTION = Path(__file__).resolve().parents[1]
ROOT = MOTION.parents[1]
INDEX = {c["clip"]: c for c in json.loads((ROOT / "assets/videos/clips_index.json").read_text())}
SCRATCH = Path(tempfile.gettempdir()) / "ve-watch"
OUT = MOTION / "out/qa/grading"


def sheet(clip, step, w, cols=10, a=None, b=None):
    c = INDEX[clip]
    proxy = ROOT / "assets/videos" / c["proxy"]
    dur = c["duration"]
    st = step if (dur > 8 or a is not None) else min(step, 0.5)
    times, t = [], (a if a is not None else 0.15)
    end = min(b, dur - 0.05) if b is not None else dur - 0.05
    while t <= end + 1e-6:
        times.append(round(t, 2))
        t += st
    od = SCRATCH / clip
    rep = subprocess.run(
        ["python3", WATCH, str(proxy), "--detail", "transcript", "--timestamps", ",".join(f"{x:.2f}" for x in times),
         "--no-whisper", "--resolution", str(w), "--out-dir", str(od)],
        capture_output=True, text=True, check=True,
    ).stdout
    frames = re.findall(r"`([^`]+/frames/cue_\d+\.jpg)`", rep)
    if len(frames) != len(times):
        raise SystemExit(f"{clip}: {len(frames)} frames para {len(times)} tiempos")
    ims = [Image.open(f).convert("RGB") for f in frames]
    h = ims[0].height
    rows = (len(ims) + cols - 1) // cols
    head = 26
    img = Image.new("RGB", (cols * (w + 3), head + rows * (h + 17)), "white")
    d = ImageDraw.Draw(img)
    f1 = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 17)
    f2 = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
    d.text((4, 4), f"{clip} · {c['file']} · {dur:.1f}s · {c['reel']}", fill="black", font=f1)
    for i, (tt, im) in enumerate(zip(times, ims)):
        x = (i % cols) * (w + 3)
        y = head + (i // cols) * (h + 17)
        d.text((x + 2, y + 1), f"{tt:.1f}s", fill="red", font=f2)
        img.paste(im, (x, y + 16))
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / (f"{clip}.jpg" if a is None else f"{clip}_{a:.1f}-{b:.1f}.jpg")
    img.save(p, quality=80)
    return p


if __name__ == "__main__":
    args = sys.argv[1:]
    step = float(args[args.index("--step") + 1]) if "--step" in args else 1.0
    w = int(args[args.index("--w") + 1]) if "--w" in args else 160
    for spec in [a for a in args if re.match(r"R\d_\d\d(:[\d.]+-[\d.]+)?$", a)]:
        cl, rng = (spec.split(":") + [None])[:2]
        if INDEX[cl]["proxy"] is None:
            print(f"{cl}: sin proxy")
            continue
        a_, b_ = (float(x) for x in rng.split("-")) if rng else (None, None)
        print(sheet(cl, step, w, a=a_, b=b_))
