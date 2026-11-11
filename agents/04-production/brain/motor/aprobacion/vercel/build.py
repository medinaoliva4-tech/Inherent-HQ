#!/usr/bin/env python3
"""Arma la página de aprobación del cliente para Vercel.
  python3 build.py data.json <fuente-display.ttf> <fuente-sans.ttf> <carpeta con <id>.mp4 y <id>.jpg>
Escribe public/index.html (cliente), public/respuestas.html (Inherent, con ?k=ADMIN_KEY), public/videos/ y api/_ids.js.
"""
import base64, json, shutil, sys
from pathlib import Path
H = Path(__file__).parent
data, disp, sans, vids = sys.argv[1:5]
d = json.loads(Path(data).read_text())
(H / "public/videos").mkdir(parents=True, exist_ok=True)
for v in d["videos"]:
    for ext in ("mp4", "jpg"):
        shutil.copy(Path(vids) / f"{v['id']}.{ext}", H / f"public/videos/{v['id']}.{ext}")
t = (H / "template.html").read_text()
t = t.replace("__DISPLAY__", base64.b64encode(Path(disp).read_bytes()).decode()).replace("__SANS__", base64.b64encode(Path(sans).read_bytes()).decode())
t = t.replace("__CLIENTE__", d["cliente"]).replace("__CICLO__", d["ciclo"]).replace("__DATA__", json.dumps(d, ensure_ascii=False))
(H / "public/index.html").write_text(t)
(H / "api/_ids.js").write_text("// Generado por build.py\nexport const IDS = " + json.dumps([v["id"] for v in d["videos"]]) + ";\n")
r = (H / "respuestas.template.html").read_text().replace("__TITLES__", json.dumps({v["id"]: v["title"] for v in d["videos"]}, ensure_ascii=False))
(H / "public/respuestas.html").write_text(r.replace("__CLIENTE__", d["cliente"]))
print("ok ·", len(d["videos"]), "piezas")
