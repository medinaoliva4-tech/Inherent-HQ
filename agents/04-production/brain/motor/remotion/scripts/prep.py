#!/usr/bin/env python3
"""Prepara tomas para edición.

Baja el original (4K 60 fps) desde Drive con yt-dlp y genera un mezzanine
1440x2560 a 60 fps (H.264 CRF 14 + audio AAC) en public/clips/<clip>.mp4.

Uso:
  python3 scripts/prep.py R1_30 R1_33 ...
  python3 scripts/prep.py R1_30:2.0-11.5      # recorta (con 0.5 s de margen)
  python3 scripts/prep.py --spectrogram R1_30  # además, espectrograma del audio
"""
import json
import subprocess
import sys
from pathlib import Path

MOTION = Path(__file__).resolve().parents[1]
ROOT = MOTION.parents[1]  # raíz del proyecto de edición del cliente
INDEX = json.loads((ROOT / "assets/videos/clips_index.json").read_text())
BY_CLIP = {c["clip"]: c for c in INDEX}
SOURCE = ROOT / "assets/videos/source"
OUT = MOTION / "public/clips"
QA = MOTION / "out/qa"
HANDLE = 0.5


def run(cmd):
    subprocess.run(cmd, check=True)


def download(clip):
    c = BY_CLIP[clip]
    dst = SOURCE / c["file"]
    if dst.exists() and dst.stat().st_size > 1_000_000:
        return dst
    fallback = sorted(SOURCE.glob(Path(c["file"]).stem + "_1080p.*"))
    if fallback:
        return fallback[0]
    SOURCE.mkdir(parents=True, exist_ok=True)
    tmpl = str(SOURCE / (Path(c["file"]).stem + ".%(ext)s"))
    url = f"https://drive.google.com/file/d/{c['drive_id']}/view"
    try:
        run(["yt-dlp", "-q", "--no-warnings", "--no-update", "-f", "source", "-o", tmpl, url])
    except subprocess.CalledProcessError:
        # Drive no siempre ofrece el original: se usa la mejor versión que exista (1080p + audio).
        fb = SOURCE / (Path(c["file"]).stem + "_1080p.%(ext)s")
        run(["yt-dlp", "-q", "--no-warnings", "--no-update", "-f", "137+140/136+140/22/18",
             "--merge-output-format", "mp4", "-o", str(fb), url])
        got = sorted(SOURCE.glob(Path(c["file"]).stem + "_1080p.*"))
        if not got:
            raise SystemExit(f"no se descargó {clip}")
        print(f"{clip}: Drive no ofrece el original; se usa {got[0].name}")
        return got[0]
    got = sorted(SOURCE.glob(Path(c["file"]).stem + ".*"))
    if not got:
        raise SystemExit(f"no se descargó {clip}")
    if got[0] != dst:
        got[0].rename(dst)
    return dst


def mezzanine(clip, rng=None):
    src = download(clip)
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{clip}.mp4"
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if rng:
        a, b = rng
        a = max(0.0, a - HANDLE)
        cmd += ["-ss", f"{a:.3f}", "-to", f"{b + HANDLE:.3f}"]
    cmd += [
        "-i", str(src),
        "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", "scale=1440:2560:flags=lanczos,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-g", "30",
        "-profile:v", "high", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart", str(dst),
    ]
    run(cmd)
    return dst


def spectrogram(clip):
    QA.mkdir(parents=True, exist_ok=True)
    src = download(clip)
    run([
        "ffmpeg", "-v", "error", "-y", "-i", str(src),
        "-lavfi", "showspectrumpic=s=1200x400:legend=1:scale=log:color=intensity",
        str(QA / f"{clip}_spec.png"),
    ])


def main(args):
    spec = "--spectrogram" in args
    for a in [x for x in args if not x.startswith("--")]:
        clip, rng = a, None
        if ":" in a:
            clip, r = a.split(":")
            s, e = r.split("-")
            rng = (float(s), float(e))
        if BY_CLIP[clip]["proxy"] is None:
            print(f"{clip}: sin archivo en Drive, se omite")
            continue
        d = mezzanine(clip, rng)
        print(f"{clip} → {d.relative_to(MOTION)} ({d.stat().st_size / 1e6:.0f} MB)" + (f" desde {max(0, rng[0] - HANDLE):.2f}s" if rng else ""))
        if spec:
            spectrogram(clip)


if __name__ == "__main__":
    main(sys.argv[1:])
