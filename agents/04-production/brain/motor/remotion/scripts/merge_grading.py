#!/usr/bin/env python3
"""Une las calificaciones G1..G6 en grading.json y genera post-production-list.md."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # raíz del proyecto de edición del cliente
GR = ROOT / "production/grading"
INDEX = {c["clip"]: c for c in json.loads((ROOT / "assets/videos/clips_index.json").read_text())}

rows = []
byclip = {}
# .jsonl (guardado incremental) primero; el .json final del mismo grupo lo reemplaza si existe.
for f in sorted(GR.glob("G*.jsonl")):
    for line in f.read_text().splitlines():
        if line.strip():
            r = json.loads(line)
            byclip[r["clip"]] = r
for f in sorted(GR.glob("G*.json")):
    for r in json.loads(f.read_text()):
        byclip[r["clip"]] = r
rows = list(byclip.values())
seen = {r["clip"] for r in rows}
missing = [c for c in INDEX if c not in seen]
order = list(INDEX)
rows.sort(key=lambda r: order.index(r["clip"]))
(GR / "grading.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))


def fmt_ranges(rs):
    return ", ".join(f"{a:.1f}–{b:.1f}s" for a, b in rs) if rs else "—"


def count(v):
    return sum(1 for r in rows if r["verdict"] == v)


lines = [
    f"# Lista de posproducción — {ROOT.name}",
    "",
    "Calificación de cada clip con la skill /watch sobre proxies 360p (los tiempos aplican al original 4K 60 fps).",
    "Rúbrica: `production/grading/RUBRIC.md`. Datos completos por clip: `production/grading/grading.json`.",
    "",
    f"**{len(rows)} clips calificados** · usar completo: {count('USAR COMPLETO')} · usar con recortes: {count('USAR CON RECORTES')}"
    f" · descartados: {count('DESCARTADO')} · sin archivo: {count('SIN ARCHIVO')}",
    "",
]
if missing:
    lines += [f"> Sin calificar: {', '.join(missing)}", ""]

reels = {}
for r in rows:
    reels.setdefault(INDEX[r["clip"]]["reel"], []).append(r)

for reel, rs in reels.items():
    lines += [f"## {reel}", "", "| Clip | Archivo | Nota | Veredicto | Conservar | Protagonista | Notas |", "|---|---|---|---|---|---|---|"]
    for r in rs:
        hero = "; ".join(f"{h['from']:.1f}–{h['to']:.1f}s {h['what']}" for h in r.get("hero") or []) or "—"
        note = r.get("summary", "")
        if r.get("duplicate_of"):
            note += f" (toma repetida; mejor: {r['duplicate_of']})"
        if r.get("issues"):
            note += " · " + "; ".join(r["issues"])
        grade = "—" if r.get("grade") is None else r["grade"]
        lines.append(
            f"| {r['clip']} | {r['file']} | {grade} | {r['verdict']} | {fmt_ranges(r.get('keep'))} | {hero} | {note.replace('|', '/')} |"
        )
    lines.append("")

lines += ["## Descartados", ""]
for r in rows:
    if r["verdict"] == "DESCARTADO":
        why = r.get("duplicate_of") and f"toma repetida (mejor: {r['duplicate_of']})" or "; ".join(r.get("issues") or []) or r.get("notes", "")
        lines.append(f"- **{r['clip']}** ({r['file']}): {why}")
lines += ["", "## Momentos protagonistas (nota ≥ 8)", ""]
for r in rows:
    if (r.get("grade") or 0) >= 8:
        for h in r.get("hero") or []:
            lines.append(f"- **{r['clip']}** {h['from']:.1f}–{h['to']:.1f}s — {h['what']}")

(ROOT / "production/post-production-list.md").write_text("\n".join(lines) + "\n")
print(f"{len(rows)} filas → grading.json y post-production-list.md; faltan: {missing}")
