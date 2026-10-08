#!/usr/bin/env python3
"""Temperatura (b*), tinte (a*) y brillo (L*) de una toma, medidos en las zonas claras y neutras (mesa, pared, ropa blanca)."""
import json, subprocess, sys
import cv2, numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
IDX = {c["clip"]: c for c in json.loads((ROOT / "assets/videos/clips_index.json").read_text())}
def frames(path, a, b, n=6, vf=""):
    out = []
    for t in np.linspace(a, b, n):
        raw = subprocess.run(["ffmpeg","-v","error","-ss",f"{t:.2f}","-i",str(path),"-frames:v","1","-vf","scale=270:480"+(","+vf if vf else ""),"-f","rawvideo","-pix_fmt","bgr24","-"],capture_output=True).stdout
        out.append(np.frombuffer(raw,np.uint8).reshape(480,270,3))
    return out
def stats(ims):
    L=[];A=[];B=[];LL=[]
    for im in ims:
        lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
        l = lab[...,0]*100/255; a = lab[...,1]-128; b = lab[...,2]-128
        chroma = np.hypot(a,b)
        m = (l > 55) & (chroma < 18)          # zonas claras casi neutras
        if m.sum() < 500: m = l > np.percentile(l, 70)
        L.append(l[m].mean()); A.append(a[m].mean()); B.append(b[m].mean()); LL.append(np.median(l))
    return dict(L_neutro=round(float(np.mean(L)),1), a=round(float(np.mean(A)),2), b=round(float(np.mean(B)),2), L_mediana=round(float(np.mean(LL)),1))
if __name__ == "__main__":
    clip, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    vf = sys.argv[4] if len(sys.argv) > 4 else ""
    print(clip, stats(frames(ROOT/"assets/videos/source"/IDX[clip]["file"], a, b, vf=vf)))
