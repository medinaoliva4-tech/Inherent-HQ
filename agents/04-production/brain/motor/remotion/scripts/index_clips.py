#!/usr/bin/env python3
"""Arma el índice de clips y baja los proxies 360p para calificar.

Entrada: el JSON que devuelve scripts/drive_listar_carpetas.js (carpeta → archivos), guardado en un archivo.
Salida:  assets/videos/clips_index.json  ·  assets/videos/proxies/R<n>/<NN>.mp4

  python3 production/motion/scripts/index_clips.py listado.json [--workers 8]

Cada clip recibe un id estable R<n>_<NN> (n = carpeta en orden alfabético, NN = archivo por nombre).
Ese id es el que se usa en la calificación, en el guion y en edit/build_reels.py.
Los proxies son 360x640 sin audio (yt-dlp, formato 134/18): rápidos de bajar y suficientes para /watch.
Los originales 4K se bajan después, solo los que se usan (scripts/prep.py · scripts/fetch_all.py).
"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
V = ROOT / "assets/videos"

def dur(p):
    try:
        return round(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).decode()), 2)
    except Exception:
        return None

def main():
    listing = json.loads(Path(sys.argv[1]).read_text())
    workers = int(sys.argv[sys.argv.index("--workers") + 1]) if "--workers" in sys.argv else 8
    rows, jobs = [], []
    for n, folder in enumerate(sorted(listing), 1):
        for k, f in enumerate(sorted(listing[folder], key=lambda x: x["name"]), 1):
            clip = f"R{n}_{k:02d}"
            proxy = V / "proxies" / f"R{n}" / f"{k:02d}.mp4"
            rows.append({"clip": clip, "reel": folder, "file": f["name"], "drive_id": f["id"], "proxy": str(proxy.relative_to(V)), "duration": None})
            jobs.append((clip, f["id"], proxy))
    def get(job):
        clip, did, proxy = job
        proxy.parent.mkdir(parents=True, exist_ok=True)
        if not proxy.exists():
            subprocess.run(["yt-dlp", "-q", "--no-warnings", "--no-update", "-f", "134/18/136", "-o", str(proxy.with_suffix(".%(ext)s")),
                            f"https://drive.google.com/file/d/{did}/view"], capture_output=True)
        return clip, dur(proxy) if proxy.exists() else None
    with ThreadPoolExecutor(workers) as ex:
        res = dict(ex.map(get, jobs))
    for r in rows:
        r["duration"] = res[r["clip"]]
        if r["duration"] is None:
            r["proxy"] = None  # Drive aún no procesó el video → SIN ARCHIVO, se reintenta después
    V.mkdir(parents=True, exist_ok=True)
    (V / "clips_index.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
    miss = [r["clip"] for r in rows if r["proxy"] is None]
    print(f"{len(rows)} clips · {len(rows) - len(miss)} con proxy · sin archivo: {miss}")

if __name__ == "__main__":
    main()
