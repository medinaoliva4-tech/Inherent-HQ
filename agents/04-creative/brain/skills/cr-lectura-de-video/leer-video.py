#!/usr/bin/env python3
"""
leer-video.py — prepara un video de referencia para que el agente lo pueda LEER.

No "mira el video": lo convierte en un paquete compacto y comparable:
  · hoja de contacto (un solo JPG con el arco completo, con timestamps quemados)
  · frames clave a resolución legible (el hook y un plano por setup)
  · cortes y duración media de plano  → el ritmo
  · texto en pantalla por plano (OCR)  → lo que dice sin voz
  · paleta dominante por plano         → la estética
  · datos técnicos                     → aspecto, duración, fps

Uso:
    python3 leer-video.py <video> [--out DIR] [--hook 3] [--fps 2] [--scene 0.12]

Requiere: ffmpeg, ffprobe, ImageMagick (montage), tesseract, numpy, Pillow.
"""
import argparse, json, os, re, shutil, subprocess, sys
from pathlib import Path

def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def need(bins):
    falta = [b for b in bins if not shutil.which(b)]
    if falta:
        sys.exit(f"Faltan binarios: {', '.join(falta)}")

def tecnico(v):
    r = sh(["ffprobe","-v","error","-select_streams","v:0",
            "-show_entries","stream=width,height,r_frame_rate,codec_name",
            "-show_entries","format=duration,size","-of","json", v])
    j = json.loads(r.stdout or "{}")
    st = (j.get("streams") or [{}])[0]; fm = j.get("format") or {}
    w, h = st.get("width"), st.get("height")
    num, den = (st.get("r_frame_rate","0/1").split("/") + ["1"])[:2]
    fps = round(float(num)/float(den or 1), 2) if float(den or 1) else None
    dur = round(float(fm.get("duration", 0) or 0), 2)
    aspecto = None
    if w and h:
        g = lambda a,b: g(b, a%b) if b else a
        d = g(w,h); aspecto = f"{w//d}:{h//d}"
    audio = bool(json.loads(sh(["ffprobe","-v","error","-select_streams","a:0",
                                "-show_entries","stream=codec_name","-of","json", v]).stdout or "{}").get("streams"))
    return {"ancho":w,"alto":h,"aspecto":aspecto,"fps":fps,"duracion_s":dur,
            "codec":st.get("codec_name"),"tiene_audio":audio,
            "peso_mb":round(int(fm.get("size",0) or 0)/1048576,2)}

def cortes(v, umbral):
    r = sh(["ffmpeg","-loglevel","error","-i",v,"-filter_complex",
            f"select='gt(scene,{umbral})',metadata=print:file=-","-an","-f","null","-"])
    return [round(float(t),2) for t in re.findall(r"pts_time:([0-9.]+)", r.stdout)]

def frames_unicos(v, out, fps, alto=720):
    """mpdecimate descarta lo casi idéntico: de N frames crudos quedan solo los distintos."""
    pat = str(out/"u%03d.jpg")
    sh(["ffmpeg","-y","-loglevel","error","-i",v,"-vf",
        f"fps={fps},mpdecimate=hi=64*12:lo=64*5:frac=0.33,scale=-2:{alto}",
        "-vsync","vfr","-q:v","3", pat])
    return sorted(out.glob("u*.jpg"))

def frame_en(v, t, dest, alto=720):
    """Extrae el frame LIMPIO. El sello de tiempo va aparte, para no contaminar el OCR."""
    sh(["ffmpeg","-y","-loglevel","error","-ss",str(t),"-i",v,"-frames:v","1",
        "-vf",f"scale=-2:{alto}","-q:v","3", str(dest)])
    return dest if dest.exists() else None

def sellar(src, t, dest):
    """Copia con el timestamp quemado — solo para la hoja de contacto."""
    sh(["ffmpeg","-y","-loglevel","error","-i",str(src),"-vf",
        f"drawtext=text='{t:g}s':fontcolor=yellow:fontsize=26:"
        "box=1:boxcolor=black@0.75:boxborderw=6:x=10:y=10","-q:v","3", str(dest)])
    return dest if dest.exists() else src

def paleta(img, n=4):
    from PIL import Image
    im = Image.open(img).convert("RGB").resize((80,80))
    q = im.quantize(colors=n, method=Image.MEDIANCUT).convert("RGB")
    cols = sorted(q.getcolors(6400) or [], reverse=True)[:n]
    return ["#%02X%02X%02X" % c for _, c in cols]

def firma(img, lado=16):
    """Firma perceptual barata: mini-thumbnail en gris, para descartar frames repetidos."""
    from PIL import Image
    import numpy as np
    a = np.asarray(Image.open(img).convert("L").resize((lado,lado)), dtype=float)
    return a / (a.max() or 1)

def parecidos(a, b, tol=0.03):
    import numpy as np
    return float(np.abs(a-b).mean()) < tol

def _tess(img):
    r = sh(["tesseract", str(img), "-", "--psm", "6", "-l", "spa+eng"])
    if r.returncode != 0:
        r = sh(["tesseract", str(img), "-", "--psm", "6"])
    return " ".join(r.stdout.split())

def ocr(img):
    """Dos pasadas: directa, y con contraste forzado para texto de bajo contraste."""
    txt = _tess(img)
    if len(txt) > 2:
        return txt
    alt = Path(str(img).replace(".jpg", "_hc.png"))
    sh(["convert", str(img), "-colorspace", "gray", "-normalize",
        "-level", "35%,85%", "-sharpen", "0x1", str(alt)])
    if alt.exists():
        txt2 = _tess(alt)
        alt.unlink(missing_ok=True)
        if len(txt2) > 2:
            return txt2 + "  [OCR con contraste forzado]"
    return ""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", default=None)
    ap.add_argument("--hook", type=float, default=3.0, help="segundos de zona de hook")
    ap.add_argument("--fps", type=float, default=2.0, help="muestreo antes de deduplicar")
    ap.add_argument("--scene", type=float, default=0.12, help="umbral de corte")
    a = ap.parse_args()

    need(["ffmpeg","ffprobe","montage","tesseract"])
    v = str(Path(a.video).resolve())
    out = Path(a.out or (Path(v).parent / (Path(v).stem + "_lectura")))
    out.mkdir(parents=True, exist_ok=True)

    tec = tecnico(v)
    cs = cortes(v, a.scene)
    bordes = [0.0] + cs + [tec["duracion_s"]]
    planos = [(bordes[i], bordes[i+1]) for i in range(len(bordes)-1) if bordes[i+1]-bordes[i] > 0.2]
    dur_planos = [round(b-a_, 2) for a_, b in planos]

    # frames del hook: cada 1s dentro de la zona, deduplicados después
    hook = []
    t = 0.15
    while t < a.hook:
        tt = round(t,2)
        f = frame_en(v, tt, out/f"hook_{tt:g}s.jpg")
        if f: hook.append((tt, f))
        t += 1.0

    # un frame por plano, en el medio del plano
    por_plano = []
    for i, (ini, fin) in enumerate(planos, 1):
        tm = round(ini + (fin-ini)/2, 2)
        f = frame_en(v, tm, out/f"plano{i:02d}.jpg")
        if f: por_plano.append((i, ini, fin, tm, f))

    # frames visualmente distintos (control de que no se perdió nada)
    unicos = frames_unicos(v, out, a.fps)

    # hoja de contacto
    sellos = out/"_sellos"; sellos.mkdir(exist_ok=True)
    hoja = out/"hoja-de-contacto.jpg"
    # orden cronológico y sin repetir el mismo cuadro dos veces
    candidatos = [(tt, f) for tt, f in hook] + [(tm, f) for _,_,_,tm,f in por_plano]
    candidatos.sort(key=lambda x: x[0])
    tiles, firmas, repetidos = [], [], 0
    for t_, f_ in candidatos:
        fg = firma(f_)
        if any(parecidos(fg, prev) for prev in firmas):
            repetidos += 1
            continue
        firmas.append(fg)
        tiles.append(str(sellar(f_, t_, sellos/f_.name)))
    if tiles:
        cols = min(6, max(3, len(tiles)))
        sh(["montage", *tiles, "-tile", f"{cols}x", "-geometry", "260x+6+6",
            "-background", "#0E1013", str(hoja)])

    # OCR y paleta por plano
    lectura_planos = []
    for i, ini, fin, tm, f in por_plano:
        lectura_planos.append({
            "plano": i, "desde_s": ini, "hasta_s": fin, "dura_s": round(fin-ini,2),
            "frame": f.name, "texto_en_pantalla": ocr(f), "paleta": paleta(f),
        })

    resumen = {
        "archivo": Path(v).name,
        "tecnico": tec,
        "ritmo": {
            "cortes_en_s": cs,
            "planos": len(planos),
            "duracion_media_de_plano_s": round(sum(dur_planos)/len(dur_planos), 2) if dur_planos else None,
            "plano_mas_corto_s": min(dur_planos) if dur_planos else None,
            "plano_mas_largo_s": max(dur_planos) if dur_planos else None,
            "umbral_usado": a.scene,
        },
        "hook": {
            "zona_s": a.hook,
            "frames": [f.name for _, f in hook],
            "texto_en_pantalla": ocr(hook[0][1]) if hook else "",
            "hay_corte_dentro_del_hook": any(c < a.hook for c in cs),
        },
        "planos": lectura_planos,
        "frames_visualmente_distintos": len(unicos),
        "tiles_en_la_hoja": len(tiles),
        "frames_repetidos_descartados": repetidos,
        "hoja_de_contacto": hoja.name if hoja.exists() else None,
        "transcripcion": "PENDIENTE — del MCP si el ad lo trae; si no, OCR de subtítulos quemados",
    }
    (out/"lectura.json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")

    # resumen legible por consola
    print(f"\n── {resumen['archivo']} ──")
    print(f"  {tec['ancho']}x{tec['alto']} ({tec['aspecto']}) · {tec['duracion_s']}s · {tec['fps']}fps · audio: {'sí' if tec['tiene_audio'] else 'no'}")
    r = resumen["ritmo"]
    print(f"  ritmo: {r['planos']} planos · promedio {r['duracion_media_de_plano_s']}s · cortes en {r['cortes_en_s']}")
    print(f"  hook ({a.hook:g}s): corte dentro del hook: {'sí' if resumen['hook']['hay_corte_dentro_del_hook'] else 'no'}")
    if resumen["hook"]["texto_en_pantalla"]:
        print(f"        texto: \"{resumen['hook']['texto_en_pantalla']}\"")
    for p in lectura_planos:
        tx = f' · "{p["texto_en_pantalla"]}"' if p["texto_en_pantalla"] else ""
        print(f"  plano {p['plano']}: {p['desde_s']}-{p['hasta_s']}s ({p['dura_s']}s) · {' '.join(p['paleta'][:3])}{tx}")
    shutil.rmtree(sellos, ignore_errors=True)
    print(f"\n  → {out}/  ({len(tiles)} tiles en la hoja, {repetidos} repetidos descartados + lectura.json)")
    print(f"  → para leer: abrí hoja-de-contacto.jpg primero, después los frames que hagan falta\n")

if __name__ == "__main__":
    main()
