#!/usr/bin/env python3
"""Hoja de revisión de un render: un fotograma cada `paso` frames, rotulado.
Uso: python3 scripts/review.py out/video.mp4 [paso=15] [ancho=150] [cols=12]"""
import subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
src = Path(sys.argv[1]); step = int(sys.argv[2]) if len(sys.argv) > 2 else 15
w = int(sys.argv[3]) if len(sys.argv) > 3 else 150; cols = int(sys.argv[4]) if len(sys.argv) > 4 else 12
n = int(subprocess.check_output(["ffprobe","-v","error","-count_packets","-select_streams","v:0","-show_entries","stream=nb_read_packets","-of","csv=p=0",str(src)]).decode().strip().strip(","))
tmp = src.parent / "qa" / f"_{src.stem}"; tmp.mkdir(parents=True, exist_ok=True)
frames = list(range(0, n, step))
sel = "+".join(f"eq(n\\,{f})" for f in frames)
subprocess.run(["ffmpeg","-v","error","-y","-i",str(src),"-vf",f"select='{sel}',scale={w}:-2","-vsync","0",str(tmp/"f_%04d.jpg")],check=True)
ims = [Image.open(tmp/f"f_{i+1:04d}.jpg") for i in range(len(frames))]
h = ims[0].height; rows = (len(ims)+cols-1)//cols
sheet = Image.new("RGB",(cols*(w+4),rows*(h+20)),"white"); d = ImageDraw.Draw(sheet)
font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc",14)
for i,(f,im) in enumerate(zip(frames,ims)):
    x=(i%cols)*(w+4); y=(i//cols)*(h+20); d.text((x+2,y+2),f"f{f} {f/30:.1f}s",fill="red",font=font); sheet.paste(im,(x,y+18))
out = src.parent / "qa" / f"{src.stem}_sheet.jpg"; sheet.save(out, quality=82); print(out)
