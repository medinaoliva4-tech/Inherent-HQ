#!/usr/bin/env python3
"""Limpia y revisa una respuesta de community antes de enviarla.

Uso:
    python3 humanizar.py respuesta.txt          # imprime la versión limpia y las marcas
    python3 humanizar.py respuesta.txt -o out   # además guarda la versión limpia

Limpia solo:
    caracteres invisibles, guion largo y medio, comillas curvas, puntos suspensivos de un carácter.
Marca (no reescribe, porque cambiar la forma de una frase necesita criterio):
    frases de IA o de plantilla, «no es solo X, es Y», tres o más signos seguidos,
    muchos emojis, y la falta de un cierre (pregunta, link o invitación).
"""

import re
import sys
import unicodedata

INVISIBLES = re.compile(
    "[​‌‍⁠﻿­᠎⁡-⁤\U000e0000-\U000e007f]"
)
ESPACIOS_RAROS = re.compile("[     ]")

REEMPLAZOS = [
    (" — ", ", "),
    ("—", ", "),
    ("–", "-"),
    ("“", '"'),
    ("”", '"'),
    ("‘", "'"),
    ("’", "'"),
    ("…", "..."),
]

FRASES_DE_IA = [
    "no dudes en",
    "estaremos encantados de",
    "será un placer",
    "en este sentido",
    "cabe destacar",
    "sin lugar a dudas",
    "experiencia única",
    "experiencia inigualable",
    "te invitamos cordialmente",
    "agradecemos tu interés",
    "quedamos atentos",
    "quedamos a tu disposición",
    "a tu entera disposición",
    "estimado cliente",
    "querido cliente",
    "en nombre de todo el equipo",
    "lamentamos profundamente",
    "tu satisfacción es nuestra prioridad",
    "nos complace",
    "sumérgete",
    "descubre la magia",
    "elevar tu experiencia",
    "de primer nivel",
    "en el mundo de",
    "en la era de",
    "sin más preámbulos",
    "es importante destacar",
    "como modelo de lenguaje",
    "como asistente",
]

PATRONES = [
    (re.compile(r"\bno (es|son) solo\b.*\b(es|son)\b", re.I), "«No es solo X, es Y»: suena a plantilla"),
    (re.compile(r"\bno solo\b.*\bsino (también|tambien)\b", re.I), "«No solo… sino también»: suena a plantilla"),
    (re.compile(r"[!¡?¿]{3,}"), "Tres o más signos seguidos"),
    (re.compile(r"\b[A-ZÁÉÍÓÚÑ]{4,}\b(\s+\b[A-ZÁÉÍÓÚÑ]{4,}\b){2,}"), "Tres palabras seguidas en mayúsculas"),
]

CIERRE = re.compile(r"(\?|wa\.me/|https?://|pedidos ?ya|te esperamos|te avisamos|escr[ií]benos|te dejo|te lo dejamos|por dm|por mensaje)", re.I)


def es_emoji(c):
    return unicodedata.category(c) == "So" or 0x1F300 <= ord(c) <= 0x1FAFF


def limpiar(texto):
    texto = INVISIBLES.sub("", texto)
    texto = ESPACIOS_RAROS.sub(" ", texto)
    for viejo, nuevo in REEMPLAZOS:
        texto = texto.replace(viejo, nuevo)
    texto = re.sub(r" ,", ",", texto)
    texto = re.sub(r",\s*,", ",", texto)
    texto = re.sub(r"[ \t]{2,}", " ", texto)
    return texto.strip()


def revisar(texto):
    marcas = []
    bajo = texto.lower()
    for frase in FRASES_DE_IA:
        if frase in bajo:
            marcas.append(f"Frase de IA o plantilla: «{frase}»")
    for patron, motivo in PATRONES:
        if patron.search(texto):
            marcas.append(motivo)
    emojis = sum(1 for c in texto if es_emoji(c))
    frases = max(1, len(re.findall(r"[.!?]+", texto)))
    if emojis > frases:
        marcas.append(f"Muchos emojis: {emojis} en {frases} frase(s)")
    if not CIERRE.search(texto):
        marcas.append("SIN CIERRE: no termina en una pregunta, un link o una invitación")
    return marcas


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    with open(sys.argv[1], encoding="utf-8") as f:
        original = f.read()
    limpio = limpiar(original)
    marcas = revisar(limpio)

    print("RESPUESTA LIMPIA")
    print("=" * 60)
    print(limpio)
    print("=" * 60)
    print(f"{len(limpio)} caracteres · {'cambió' if limpio != original.strip() else 'sin cambios'} en la limpieza")
    if marcas:
        print("\nREESCRIBIR A MANO")
        for m in marcas:
            print(f"  - {m}")
    else:
        print("\nOK: lista para enviar")

    if "-o" in sys.argv:
        destino = sys.argv[sys.argv.index("-o") + 1]
        with open(destino, "w", encoding="utf-8") as f:
            f.write(limpio + "\n")

    sys.exit(1 if marcas else 0)


if __name__ == "__main__":
    main()
